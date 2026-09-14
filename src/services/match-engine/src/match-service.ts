import { randomUUID, randomInt } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { LocalMatch } from '../../../packages/shared/src/contracts';
import { completeStoredMatch, createStoredMatch, publicMatch, type StoredMatch } from '../../../packages/shared/src/match-record';

export class MatchError extends Error {
  constructor(public statusCode: number, message: string) { super(message); }
}

export class MatchService {
  private running = new Set<string>();
  constructor(private directory = resolve(process.env.REPLAY_DIR ?? 'data/matches')) {}

  private path(id: string) {
    if (!z.string().uuid().safeParse(id).success) throw new MatchError(400, 'Identificador de partida inválido.');
    return resolve(this.directory, `${id}.json`);
  }

  private async save(match: StoredMatch) {
    await mkdir(this.directory, { recursive: true });
    const target = this.path(match.matchId);
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(match, null, 2), { flag: 'wx', mode: 0o600 });
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
    }
  }

  async create(seed: number): Promise<LocalMatch> {
    return this.createStored(seed);
  }

  async createTestnet(contractId: string): Promise<LocalMatch> {
    return this.createStored(randomInt(0x100000000), contractId);
  }

  private async createStored(seed: number, testnetContractId?: string): Promise<LocalMatch> {
    const match = await createStoredMatch(seed, testnetContractId);
    await this.save(match);
    return publicMatch(match);
  }

  async get(id: string): Promise<LocalMatch> {
    return publicMatch(await this.load(id));
  }

  private async load(id: string): Promise<StoredMatch> {
    try { return JSON.parse(await readFile(this.path(id), 'utf8')) as StoredMatch; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new MatchError(404, 'Partida no encontrada.');
      throw error;
    }
  }

  async bindTestnet(id: string, binding: NonNullable<LocalMatch['testnet']>): Promise<LocalMatch> {
    const match = await this.load(id);
    if (match.status !== 'Ready' || match.testnet) throw new MatchError(409, 'La partida ya está vinculada o ejecutada.');
    const bound = { ...match, testnet: binding }; await this.save(bound); return publicMatch(bound);
  }

  async run(id: string, funding?: { contractId: string; chainId: string }): Promise<LocalMatch> {
    this.path(id);
    if (this.running.has(id)) throw new MatchError(409, 'La partida ya se está ejecutando.');
    this.running.add(id);
    try {
      const match = await this.load(id);
      let completed: StoredMatch;
      try { completed = await completeStoredMatch(match, funding); }
      catch (error) { throw new MatchError(409, (error as Error).message); }
      await this.save(completed);
      return publicMatch(completed);
    } finally { this.running.delete(id); }
  }
}
