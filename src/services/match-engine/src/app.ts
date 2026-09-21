import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { ENGINE_VERSION, seedSchema } from '../../../packages/shared/src/contracts';
import { MatchError, MatchService } from './match-service';
import { TestnetService } from './testnet-service';
import { addressSchema } from '../../../packages/shared/src/stellar';
import { RpcReadError } from '../../../packages/shared/src/stellar-rpc';
import { registeredEngineDescriptors } from '../../../packages/shared/src/game-engine';

const engineVersionSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*\/\d+\.\d+\.\d+$/);

export interface ArenaPayAppOptions {
  publicMode?: boolean;
  allowedOrigins?: string[];
  dailyMatchLimit?: number;
}

class DailyQuota {
  private day = '';
  private used = 0;
  constructor(private readonly maximum: number) {}
  consume(now = new Date()) {
    const day = now.toISOString().slice(0, 10);
    if (day !== this.day) { this.day = day; this.used = 0; }
    if (this.used >= this.maximum) throw new MatchError(429, 'Se alcanzó el límite diario de partidas públicas. Vuelve a intentarlo después de las 00:00 UTC.');
    this.used += 1;
  }
}

class RequestQuota {
  private readonly counters = new Map<string, { used: number; expires: number }>();
  consume(visitor: string, action: string, maximum: number, durationMs: number) {
    const key = `${action}:${visitor}`, now = Date.now(), current = this.counters.get(key);
    const counter = !current || current.expires <= now ? { used: 0, expires: now + durationMs } : current;
    counter.used += 1; this.counters.set(key, counter);
    if (counter.used > maximum) throw new MatchError(429, 'Se alcanzó el límite temporal de solicitudes. Inténtalo más tarde.');
  }
}

const positiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function buildApp(service = new MatchService(), options: ArenaPayAppOptions = {}) {
  const publicMode = options.publicMode ?? process.env.ARENAPAY_PUBLIC_MODE === 'true';
  const allowedOrigins = options.allowedOrigins ?? process.env.ARENAPAY_ALLOWED_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean) ?? [];
  if (publicMode && allowedOrigins.length === 0) throw new Error('ARENAPAY_ALLOWED_ORIGINS es obligatorio en modo público.');
  const app = Fastify({ bodyLimit: 16_384, logger: publicMode && process.env.NODE_ENV !== 'test', trustProxy: publicMode });
  const testnet = new TestnetService(service);
  const dailyQuota = new DailyQuota(options.dailyMatchLimit ?? positiveInteger(process.env.ARENAPAY_DAILY_MATCH_LIMIT, 20));
  const requestQuota = new RequestQuota();
  if (publicMode) {
    void app.register(cors, {
      credentials: false,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    });
    app.addHook('onRequest', async request => {
      requestQuota.consume(request.ip, 'global', 120, 60_000);
      const route = request.url.split('?')[0];
      if (request.method === 'POST' && route === '/api/testnet/matches') requestQuota.consume(request.ip, 'create', 3, 3_600_000);
      else if (request.method === 'POST' && route.endsWith('/run')) requestQuota.consume(request.ip, 'run', 10, 3_600_000);
      else if (request.method === 'POST' && route.endsWith('/resolution')) requestQuota.consume(request.ip, 'resolution', 20, 3_600_000);
    });
  }
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) return reply.code(400).send({ message: 'Datos inválidos. La semilla debe ser un entero entre 0 y 4294967295.' });
    if (error instanceof MatchError) return reply.code(error.statusCode).send({ message: error.message });
    if (error instanceof RpcReadError) return reply.code(502).send({ message: error.message });
    if (typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ message: 'Solicitud inválida.' });
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'No se pudo completar la operación. Comprueba el servicio, su almacenamiento y la conexión con Testnet.' });
  });
  app.get('/api/health', async () => ({ status: 'ok', mode: publicMode ? 'public' : 'local', persistence: 'filesystem', engineVersion: ENGINE_VERSION }));
  app.get('/api/games', async () => ({ engines: registeredEngineDescriptors() }));
  app.get('/api/testnet/config', () => testnet.configuration());
  app.get('/api/testnet/latest', async () => {
    const config = await testnet.configuration();
    if (!config.latestMatchId) throw new MatchError(404, 'Todavía no hay un ensayo de Testnet guardado.');
    return service.get(config.latestMatchId);
  });
  app.post('/api/testnet/matches', async (request, reply) => {
    const value = z.object({ playerA: addressSchema, playerB: addressSchema,
      buyIn: z.string().regex(/^[1-9][0-9]*$/).refine(amount => BigInt(amount) <= 100_000_000n),
      engineVersion: engineVersionSchema.optional() }).strict().parse(request.body);
    if (publicMode) dailyQuota.consume();
    return reply.code(201).send(await testnet.create(value.playerA, value.playerB, value.buyIn, value.engineVersion));
  });
  app.get<{ Params: { id: string } }>('/api/testnet/matches/:id', request => testnet.state(request.params.id));
  app.post<{ Params: { id: string } }>('/api/testnet/matches/:id/run', request => testnet.run(request.params.id));
  app.post<{ Params: { id: string } }>('/api/testnet/matches/:id/resolution', request => testnet.resolution(request.params.id));
  if (!publicMode) {
    app.post('/api/matches', async (request, reply) => {
      const { seed, engineVersion } = z.object({ seed: seedSchema, engineVersion: engineVersionSchema.optional() }).strict().parse(request.body);
      return reply.code(201).send(await service.create(seed, engineVersion));
    });
    app.get<{ Params: { id: string } }>('/api/matches/:id', request => service.get(request.params.id));
    app.post<{ Params: { id: string } }>('/api/matches/:id/run', async request => {
      if (request.body !== undefined) z.object({}).strict().parse(request.body);
      return service.run(request.params.id);
    });
    app.get<{ Params: { id: string } }>('/api/matches/:id/replay', async (request, reply) => {
      const match = await service.get(request.params.id);
      if (!match.replay) throw new MatchError(409, 'Ejecuta la partida antes de descargar el replay.');
      return reply.header('Content-Disposition', `attachment; filename="arenapay-${match.matchId}.json"`).send(match.replay);
    });
  }
  return app;
}
