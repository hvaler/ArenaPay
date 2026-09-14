import { ENGINE_VERSION, seedSchema, type LocalMatch } from '../../../../packages/shared/src/contracts';
import { buildReplay, createNonce, seedCommitment } from '../../../../packages/shared/src/simulation';

// Explicit public-demo mode. These records never represent escrow or deposits.
const records = new Map<string, LocalMatch>();
const nonces = new Map<string, string>();
export const practiceApi = {
  async create(seed: number): Promise<LocalMatch> {
    seedSchema.parse(seed);
    const nonce = createNonce();
    const match: LocalMatch = { matchId: crypto.randomUUID(), mode: 'local', status: 'Ready', seed, seedHash: await seedCommitment(seed, nonce), engineVersion: ENGINE_VERSION, createdAt: new Date().toISOString() };
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
    const completed: LocalMatch = { ...match, status: 'Completed', replay: await buildReplay(id, match.seed!, nonces.get(id)!) };
    records.set(id, completed); return completed;
  },
};
