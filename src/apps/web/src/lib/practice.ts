import { seedSchema, type LocalMatch } from '../../../../packages/shared/src/contracts';
import { currentGameEngine } from '../../../../packages/shared/src/engines/resource-arena';

// Explicit public-demo mode. These records never represent escrow or deposits.
const records = new Map<string, LocalMatch>();
const nonces = new Map<string, string>();
export const practiceApi = {
  async create(seed: number): Promise<LocalMatch> {
    seedSchema.parse(seed);
    const nonce = currentGameEngine.createSecret();
    if (!nonce) throw new Error('El motor actual no genera secretos.');
    const createdAt = new Date().toISOString();
    const match: LocalMatch = { matchId: crypto.randomUUID(), mode: 'local', status: 'Ready', seed, seedHash: await currentGameEngine.seedCommitment(seed, nonce), engineVersion: currentGameEngine.version, createdAt, revision: 0, updatedAt: createdAt };
    nonces.set(match.matchId, nonce);
    records.set(match.matchId, match); return match;
  },
  async get(id: string): Promise<LocalMatch> {
    const match = records.get(id);
    if (!match) throw new Error('La práctica ya no está en este navegador. Crea otra o importa el replay descargado.');
    return match;
  },
  async run(id: string, testnet = false): Promise<LocalMatch> {
    if (testnet) throw new Error('La demo pública no realiza operaciones Testnet.');
    const match = await practiceApi.get(id);
    if (match.replay) return match;
    const replay = await currentGameEngine.buildReplay(id, match.seed!, nonces.get(id));
    const completed: LocalMatch = { ...match, status: 'Completed', replay, outcome: { type: 'win', winner: replay.winner, reason: 'rules' },
      revision: (match.revision ?? 0) + 1, updatedAt: new Date().toISOString() };
    records.set(id, completed); return completed;
  },
};
