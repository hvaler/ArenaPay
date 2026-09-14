import { DurableObject } from 'cloudflare:workers';
import { Contract, Keypair, scValToNative } from '@stellar/stellar-sdk/base';
import { z } from 'zod';
import deployment from '../../../../config/testnet.deployment.json';
import { ENGINE_VERSION, type LocalMatch } from '../../../packages/shared/src/contracts';
import { completeStoredMatch, createStoredMatch, publicMatch, type StoredMatch } from '../../../packages/shared/src/match-record';
import { addressSchema, decodeMatch, hex, sc, type ChainBudget, type TestnetConfig } from '../../../packages/shared/src/stellar';
import { RpcReadError, StellarRpc } from '../../../packages/shared/src/stellar-rpc';
import { signResult } from '../../match-engine/src/referee';

interface Env {
  ARENA: DurableObjectNamespace<ArenaCoordinator>;
  ASSETS: Fetcher;
  ARENAPAY_ADMIN_SECRET: string;
  ARENAPAY_REFEREE_SECRET: string;
  ARENAPAY_RATE_LIMIT_SALT: string;
  ARENAPAY_ALLOWED_ORIGINS?: string;
  ARENAPAY_RPC_URL?: string;
  ARENAPAY_READ_RPC_URLS?: string;
  ARENAPAY_DAILY_MATCH_LIMIT?: string;
}

class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const json = (value: unknown, status = 200, headers?: HeadersInit) => Response.json(value, { status, headers });
const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

class DurableMatchStore {
  private running = new Set<string>();
  constructor(private readonly storage: DurableObjectStorage) {}

  private key(id: string) {
    if (!z.string().uuid().safeParse(id).success) throw new ApiError(400, 'Identificador de partida inválido.');
    return `match:${id}`;
  }
  private async load(id: string) {
    const match = await this.storage.get<StoredMatch>(this.key(id));
    if (!match) throw new ApiError(404, 'Partida no encontrada.');
    return match;
  }
  async get(id: string) { return publicMatch(await this.load(id)); }
  async createTestnet(contractId: string) {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const match = await createStoredMatch(seed, contractId);
    await this.storage.put(this.key(match.matchId), match);
    return publicMatch(match);
  }
  async setCreateTransaction(id: string, hash: string) {
    const match = await this.load(id);
    const updated: StoredMatch = { ...match, testnet: { ...match.testnet!, createTx: hash } };
    await this.storage.put({ [this.key(id)]: updated, latestMatchId: id });
    return publicMatch(updated);
  }
  async latestId() { return this.storage.get<string>('latestMatchId'); }
  async run(id: string, funding?: { contractId: string; chainId: string }): Promise<LocalMatch> {
    this.key(id);
    if (this.running.has(id)) throw new ApiError(409, 'La partida ya se está ejecutando.');
    this.running.add(id);
    try {
      const match = await this.load(id);
      let completed: StoredMatch;
      try { completed = await completeStoredMatch(match, funding); }
      catch (error) { throw new ApiError(409, (error as Error).message); }
      await this.storage.put(this.key(id), completed);
      return publicMatch(completed);
    } finally { this.running.delete(id); }
  }
}

export class ArenaCoordinator extends DurableObject<Env> {
  private readonly matches: DurableMatchStore;
  private creating = false;
  private readonly rateCounters = new Map<string, { used: number; expires: number }>();
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.matches = new DurableMatchStore(ctx.storage);
  }

  private rpcConfiguration() {
    const rpcUrl = this.env.ARENAPAY_RPC_URL?.trim() || deployment.rpcUrl;
    const readRpcUrls = this.env.ARENAPAY_READ_RPC_URLS?.split(',').map(value => value.trim()).filter(Boolean) ?? deployment.readRpcUrls;
    return { rpcUrl, readRpcUrls };
  }
  private async configuration(): Promise<TestnetConfig> {
    const latestMatchId = await this.matches.latestId();
    const ready = Boolean(this.env.ARENAPAY_ADMIN_SECRET && this.env.ARENAPAY_REFEREE_SECRET && this.env.ARENAPAY_RATE_LIMIT_SALT);
    return { ready, network: 'testnet', ...this.rpcConfiguration(), contractId: deployment.contractId, tokenId: deployment.tokenId,
      adminPublicKey: deployment.adminPublicKey, refereePublicKey: deployment.refereePublicKey, latestMatchId,
      reason: ready ? undefined : 'El servicio de Testnet no está disponible temporalmente.' };
  }
  private async context() {
    const config = await this.configuration();
    if (!config.ready || !config.contractId || !config.adminPublicKey) throw new ApiError(503, config.reason ?? 'Testnet no configurada.');
    const rpc = new StellarRpc(config.rpcUrl, config.readRpcUrls);
    const actual = scValToNative(await rpc.read(config.contractId, 'get_config', [], config.adminPublicKey));
    if (actual.admin !== config.adminPublicKey || actual.token !== config.tokenId || hex(actual.referee) !== config.refereePublicKey
      || Keypair.fromSecret(this.env.ARENAPAY_ADMIN_SECRET).publicKey() !== config.adminPublicKey
      || hex(Keypair.fromSecret(this.env.ARENAPAY_REFEREE_SECRET).rawPublicKey()) !== config.refereePublicKey) throw new ApiError(503, 'La configuración no coincide con el contrato.');
    return { config, rpc, contractId: config.contractId, source: config.adminPublicKey };
  }
  private async create(playerA: string, playerB: string, buyIn: string) {
    if (this.creating) throw new ApiError(409, 'Hay una creación en curso. Espera su confirmación.');
    if (playerA === playerB) throw new ApiError(400, 'Los participantes deben ser diferentes.');
    this.creating = true;
    try {
      const { rpc, contractId } = await this.context();
      const local = await this.matches.createTestnet(contractId);
      const ledger = await rpc.latestLedger();
      const operation = new Contract(contractId).call('create_match', sc.bytes(local.testnet!.chainId), sc.address(playerA), sc.address(playerB),
        sc.amount(buyIn), sc.text(ENGINE_VERSION), sc.bytes(local.seedHash), sc.u32(ledger.sequence + 720));
      const key = Keypair.fromSecret(this.env.ARENAPAY_ADMIN_SECRET);
      const tx = await rpc.prepare(key.publicKey(), operation); tx.sign(key);
      const sent = await rpc.submit(tx);
      return this.matches.setCreateTransaction(local.matchId, sent.hash);
    } finally { this.creating = false; }
  }
  private async state(localId: string) {
    const local = await this.matches.get(localId);
    const { rpc, contractId, source } = await this.context();
    if (local.testnet?.contractId !== contractId) throw new ApiError(409, 'Esta partida no pertenece al contrato configurado.');
    const chain = decodeMatch(await rpc.read(contractId, 'get_match', [sc.bytes(local.testnet.chainId)], source));
    const budget = async (player: string): Promise<ChainBudget | null> => {
      const value = scValToNative(await rpc.read(contractId, 'get_budget', [sc.address(player)], source));
      return value ? { maximum: String(value.maximum), spent: String(value.spent), expiresLedger: value.expires_ledger } : null;
    };
    const [budgetA, budgetB, ledger] = await Promise.all([budget(chain.playerA), budget(chain.playerB), rpc.latestLedger()]);
    return { local, chain, budgetA, budgetB, ledger: ledger.sequence };
  }
  private async run(localId: string) {
    const { local, chain, ledger } = await this.state(localId);
    if (chain.status !== 'Funded' || ledger >= chain.timeoutLedger) throw new ApiError(409, 'La partida necesita dos depósitos confirmados y un plazo vigente.');
    return local.replay ? local : this.matches.run(localId, local.testnet);
  }
  private async resolution(localId: string) {
    const { local, chain, ledger } = await this.state(localId);
    if (!local.replay) throw new ApiError(409, 'Ejecuta la partida antes de solicitar la firma.');
    return signResult(this.env.ARENAPAY_REFEREE_SECRET, local.testnet!.contractId, local.replay, chain, ledger);
  }
  private async rateLimit(request: Request, action: string, maximum: number, durationMs: number) {
    // Vercel preserves the visitor in X-Forwarded-For; direct Workers requests use CF-Connecting-IP.
    const ip = request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || request.headers.get('CF-Connecting-IP') || 'unknown';
    const material = new TextEncoder().encode(`${this.env.ARENAPAY_RATE_LIMIT_SALT}:${ip}`);
    const digest = await crypto.subtle.digest('SHA-256', material);
    const visitor = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
    const key = `${action}:${visitor}`;
    const now = Date.now(), current = this.rateCounters.get(key);
    const counter = !current || current.expires <= now ? { used: 0, expires: now + durationMs } : current;
    counter.used += 1; this.rateCounters.set(key, counter);
    if (counter.used > maximum) throw new ApiError(429, 'Se alcanzó el límite temporal de solicitudes. Inténtalo más tarde.');
  }
  private async dailyQuota() {
    const day = new Date().toISOString().slice(0, 10);
    const key = `daily:${day}`;
    const used = await this.ctx.storage.get<number>(key) ?? 0;
    await this.ctx.storage.put(key, used + 1);
    if (used >= positiveInteger(this.env.ARENAPAY_DAILY_MATCH_LIMIT, 20)) throw new ApiError(429, 'Se alcanzó el límite diario de partidas públicas. Vuelve a intentarlo después de las 00:00 UTC.');
  }
  private async body(request: Request) {
    const declared = Number(request.headers.get('Content-Length') ?? 0);
    if (declared > 16_384) throw new ApiError(413, 'La solicitud es demasiado grande.');
    const text = await request.text();
    if (text.length > 16_384) throw new ApiError(413, 'La solicitud es demasiado grande.');
    if (!text) return undefined;
    try { return JSON.parse(text); } catch { throw new ApiError(400, 'El cuerpo debe ser JSON válido.'); }
  }
  private cors(request: Request) {
    const origin = request.headers.get('Origin');
    if (!origin) return new Headers();
    const self = new URL(request.url).origin;
    const allowed = this.env.ARENAPAY_ALLOWED_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
    if (origin !== self && !allowed.includes(origin)) throw new ApiError(403, 'Origen no autorizado.');
    const headers = new Headers({ 'Access-Control-Allow-Origin': origin, Vary: 'Origin' });
    if (request.method === 'OPTIONS') {
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '86400');
    }
    return headers;
  }
  async fetch(request: Request) {
    let corsHeaders = new Headers();
    try {
      corsHeaders = this.cors(request);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
      const requestBody = request.method === 'POST' ? await this.body(request) : undefined;
      await this.rateLimit(request, 'global', 120, 60_000);
      const { pathname } = new URL(request.url);
      if (request.method === 'GET' && pathname === '/api/health') return json({ status: 'ok', mode: 'public', persistence: 'durable-object', engineVersion: ENGINE_VERSION }, 200, corsHeaders);
      if (request.method === 'GET' && pathname === '/api/testnet/config') return json(await this.configuration(), 200, corsHeaders);
      if (request.method === 'GET' && pathname === '/api/testnet/latest') {
        const id = await this.matches.latestId();
        if (!id) throw new ApiError(404, 'Todavía no hay una partida pública guardada.');
        return json(await this.matches.get(id), 200, corsHeaders);
      }
      if (request.method === 'POST' && pathname === '/api/testnet/matches') {
        await this.rateLimit(request, 'create', 3, 3_600_000);
        const value = z.object({ playerA: addressSchema, playerB: addressSchema,
          buyIn: z.string().regex(/^[1-9][0-9]*$/).refine(amount => BigInt(amount) <= 100_000_000n) }).strict().parse(requestBody);
        await this.dailyQuota();
        return json(await this.create(value.playerA, value.playerB, value.buyIn), 201, corsHeaders);
      }
      const match = pathname.match(/^\/api\/testnet\/matches\/([0-9a-f-]+)(?:\/(run|resolution))?$/i);
      if (match && request.method === 'GET' && !match[2]) return json(await this.state(match[1]), 200, corsHeaders);
      if (match && request.method === 'POST' && match[2] === 'run') { await this.rateLimit(request, 'run', 10, 3_600_000); return json(await this.run(match[1]), 200, corsHeaders); }
      if (match && request.method === 'POST' && match[2] === 'resolution') { await this.rateLimit(request, 'resolution', 20, 3_600_000); return json(await this.resolution(match[1]), 200, corsHeaders); }
      throw new ApiError(404, 'Ruta no encontrada.');
    } catch (error) {
      if (error instanceof z.ZodError) return json({ message: 'Datos inválidos.' }, 400, corsHeaders);
      if (error instanceof ApiError) return json({ message: error.message }, error.status, corsHeaders);
      if (error instanceof RpcReadError) return json({ message: error.message }, 502, corsHeaders);
      console.error('ArenaPay Worker error', error);
      return json({ message: 'No se pudo completar la operación. Comprueba Testnet e inténtalo de nuevo.' }, 500, corsHeaders);
    }
  }
}

export default {
  fetch(request: Request, env: Env) {
    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith('/api/')) return env.ARENA.getByName('primary').fetch(request);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
