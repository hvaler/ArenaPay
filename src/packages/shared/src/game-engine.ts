/** Minimal evidence envelope shared by every ArenaPay game engine. */
export interface VersionedReplay {
  engineVersion: string;
  seed: number;
  seedHash: string;
}

export interface GameEngineDescriptor {
  readonly gameId: string;
  readonly displayName: string;
  readonly lifecycle: 'active' | 'historical';
  readonly rendererId: string;
  readonly replayFormat: string;
  readonly capabilities: Readonly<{
    agents: boolean;
    humans: boolean;
    turns: boolean;
    draws: boolean;
    cancellation: boolean;
  }>;
}

export interface EngineRun<TState, TWinner> {
  state: TState;
  frames: TState[];
  winner: TWinner;
}

export interface EngineVerification<TState, TWinner> extends EngineRun<TState, TWinner> {
  valid: boolean;
  actualHash: string;
}

export interface EngineTurnTransition<TState> {
  state: TState;
  nextPlayer?: string;
  outcome?: import('./replay-envelope').MatchOutcome;
}

/** Optional rules adapter used by interactive, turn-based engines such as Hex. */
export interface EngineTurnProtocol<TState, TAction> {
  createState(configuration: Readonly<Record<string, unknown>>): TState;
  parseAction(raw: unknown): TAction;
  applyAction(state: TState, action: TAction, player: string): EngineTurnTransition<TState>;
}

/** Boundary between the reusable platform and one deterministic game. */
export interface GameEngine<TReplay extends VersionedReplay, TState, TInput, TWinner> {
  readonly version: TReplay['engineVersion'];
  readonly descriptor: GameEngineDescriptor;
  readonly requiresSecret: boolean;
  readonly turnProtocol?: EngineTurnProtocol<TState, TInput>;
  initialState(seed: number): TState;
  run(seed: number, inputs: readonly TInput[]): EngineRun<TState, TWinner>;
  createSecret(): string | undefined;
  seedCommitment(seed: number, secret?: string): Promise<string>;
  buildReplay(matchId: string, seed: number, secret?: string): Promise<TReplay>;
  verifyReplay(raw: unknown, expectedSeedHash?: string): Promise<EngineVerification<TState, TWinner>>;
}

// Each adapter validates its own replay before execution. Type erasure is kept
// inside this registry so orchestration can select engines by immutable version.
type RegisteredEngine = GameEngine<any, any, any, any>;
const engines = new Map<string, RegisteredEngine>();

export function registerGameEngine(engine: RegisteredEngine): void {
  if (engines.has(engine.version)) throw new Error(`Motor duplicado: ${engine.version}`);
  engines.set(engine.version, engine);
}

export function getGameEngine(version: string): RegisteredEngine {
  const engine = engines.get(version);
  if (!engine) throw new Error('Versión de motor desconocida.');
  return engine;
}

export function replayEngineVersion(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null || !('engineVersion' in raw)
    || typeof raw.engineVersion !== 'string' || raw.engineVersion.length === 0) {
    throw new Error('El replay no declara una versión de motor válida.');
  }
  return raw.engineVersion;
}

export function registeredEngineVersions(): readonly string[] {
  return [...engines.keys()];
}

export function registeredEngineDescriptors(): readonly (GameEngineDescriptor & { engineVersion: string })[] {
  return [...engines.values()].map(engine => ({ engineVersion: engine.version, ...engine.descriptor }));
}

export function getActiveGameEngine(version: string): RegisteredEngine {
  const engine = getGameEngine(version);
  if (engine.descriptor.lifecycle !== 'active') throw new Error('Este motor es histórico y no admite partidas nuevas.');
  return engine;
}
