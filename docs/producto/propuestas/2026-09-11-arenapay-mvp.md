# ArenaPay MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-agent, deterministic web tournament that locks two testnet buy-ins in Soroban and pays the verified winner atomically.

**Architecture:** A React web client controls two demo agents and displays the replay. A Node API runs a deterministic grid simulation, persists a replay artifact, and signs a match result with a testnet-only referee key. A Rust Soroban escrow contract is the source of truth for entries, status, result acceptance, and payout; the browser verifies its emitted events through Stellar RPC.

**Tech Stack:** Rust 1.84+ and Soroban SDK, Stellar CLI, Stellar Testnet, TypeScript, Node.js 22 LTS, Fastify, React with Vite, Vitest, Playwright, `@stellar/stellar-sdk`, Docker Compose for optional local infrastructure.

**Spec:** `outputs/ArenaPay_Propuesta_Stellar_Odyssey.docx`

## Global Constraints

- Target only Stellar Testnet; do not connect mainnet assets, use real funds, or describe the MVP as a financial product.
- The contract accepts a configured SEP-41 token contract and uses integer token amounts only.
- Two participants per match; each contributes exactly the configured buy-in.
- The winner supplied to the contract must equal `player_a` or `player_b`; third-party payout addresses are invalid.
- The referee is a single testnet-only signer; decentralized arbitration, lending, betting, staking, reputation, and wallet custody are excluded.
- Simulation is deterministic: fixed timestep, integer arithmetic, versioned rules, committed seed, complete input log, and final state hash.
- The game is a short discrete grid arena, not a continuous-physics engine. Document update order, integer rounding, canonical serialization, random generator, and invalid-input behavior in the README.
- A player wallet signs deposits. The app never transmits or persists a user's secret key.
- Every state transition is idempotent and every contract-changing action is covered by unit and integration tests.
- Demo success means: register match, fund both entries, replay a match, submit a valid signed result, show the Stellar transaction, and show the winner payout in under three minutes.
- Use this exact product statement in the README, interface, video, and presentation: “ArenaPay es un torneo verificable para agentes de IA: compiten de forma autónoma, el replay demuestra el resultado y Soroban liquida el premio automáticamente.”

## Design Amendments from Technical Review

- Use `Created`, `Funded`, `Settled`, and `Cancelled` as the exact contract states. `Settled` replaces the earlier name `Resolved` for the on-chain terminal state.
- Store each `MatchRecord` in persistent storage and extend its TTL when it is created, deposited into, read, settled, or cancelled. Do not store an active match in temporary storage.
- Persist `timeout_ledger` at creation. After that ledger is reached, either player may call `cancel_match`; the contract returns only the deposits actually received, changes the state to `Cancelled`, and emits an event.
- The referee signs `SHA256("ARENAPAY_V1" || match_id || engine_version || seed_hash || winner_xdr || final_state_hash)`. The contract verifies that Ed25519 signature before payout. Domain separation prevents the same signature from being reused in another protocol.
- Emit `created`, `funded`, `settled`, and `cancelled` events. The frontend first polls contract state and events; an event stream is an enhancement only if it is stable in the chosen RPC provider.
- Agent A and Agent B must have visibly different deterministic policies. A pre-match LLM call may choose configuration parameters, but its output is saved as an input artifact before tick zero; no LLM call may influence a running match.
- The UI must expose a one-click reproducibility check that replays the stored JSON locally and compares its hash with the hash emitted by the contract.
- Prepare a 90-second Testnet fallback recording and configure a primary plus backup Soroban RPC URL for the Demo Day.
- Freeze scope after the first successful end-to-end settlement. All uncompleted P2 enhancements remain explicitly out of the delivery branch.

---

## File Structure

```text
arenapay/
  contracts/arena_escrow/
    src/lib.rs                 # Soroban contract, storage keys, events, state machine
    src/test.rs                # Contract unit tests
  services/match-engine/
    src/simulation.ts          # Deterministic simulation and hashable state
    src/match-service.ts       # Match lifecycle and replay artifact creation
    src/referee.ts             # Testnet-only result signing and verification
    src/server.ts              # Fastify HTTP API
    test/simulation.test.ts    # Determinism tests
    test/match-service.test.ts # Lifecycle and replay tests
  apps/web/
    src/lib/stellar.ts         # Wallet and contract invocation adapter
    src/lib/api.ts             # Typed calls to match-engine
    src/components/Arena.tsx   # Live grid and replay controls
    src/components/MatchCard.tsx # Funding and result state
    src/App.tsx                # Demo route and composition
    src/App.test.tsx           # UI state tests
  scripts/
    deploy-testnet.ts          # Deploy, initialize and print contract ID
    fund-demo-accounts.ts      # Testnet-only account and token setup
  packages/shared/
    src/contracts.ts           # MatchStatus, MatchRecord and API types
    src/hash.ts                # Canonical serialization and SHA-256 helpers
  README.md                    # One-command local demo and Testnet verification steps
  .env.example                 # Public configuration names only; no secrets
  docker-compose.yml           # Optional local engine and web startup
```

## Interface Contract

```ts
export type MatchStatus = "Created" | "Funded" | "Settled" | "Cancelled";

export interface MatchRecord {
  matchId: string;
  playerA: string;
  playerB: string;
  buyIn: bigint;
  engineVersion: string;
  seedHash: string;
  timeoutLedger: number;
  finalStateHash?: string;
  winner?: string;
  status: MatchStatus;
}

export interface Replay {
  matchId: string;
  engineVersion: string;
  seed: number;
  inputs: Array<{ tick: number; player: "A" | "B"; move: "UP" | "DOWN" | "LEFT" | "RIGHT" | "STAY" }>;
  finalStateHash: string;
  winner: "A" | "B";
}
```

### Task 1: Bootstrap the workspace and deterministic shared types

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `packages/shared/src/contracts.ts`
- Create: `packages/shared/src/hash.ts`
- Create: `packages/shared/test/hash.test.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `MatchStatus`, `MatchRecord`, `Replay`, `canonicalJson(value): string`, and `sha256Hex(value: string): string`.
- Consumed by: every TypeScript package in Tasks 3 through 7.

- [ ] **Step 1: Initialize the workspace and install only runtime dependencies.**

```powershell
pnpm init
pnpm add -w typescript vitest @types/node
pnpm add --filter @arenapay/shared zod
```

- [ ] **Step 2: Write the failing canonical hash test.**

```ts
import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../src/hash";

describe("canonicalJson", () => {
  it("sorts object keys before hashing", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(sha256Hex(canonicalJson({ b: 2, a: 1 })))
      .toBe(sha256Hex(canonicalJson({ a: 1, b: 2 })));
  });
});
```

- [ ] **Step 3: Run the test to verify it fails.**

Run: `pnpm --filter @arenapay/shared test`

Expected: FAIL because `hash.ts` does not exist.

- [ ] **Step 4: Implement canonical serialization and shared types.**

```ts
import { createHash } from "node:crypto";

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
```

- [ ] **Step 5: Add the public environment contract.**

```dotenv
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_ARENA_ESCROW_CONTRACT_ID=
MATCH_ENGINE_URL=http://localhost:3001
REFEREE_PUBLIC_KEY=
REFEREE_SECRET_KEY=
```

- [ ] **Step 6: Run the test and type check.**

Run: `pnpm --filter @arenapay/shared test && pnpm --filter @arenapay/shared exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit the workspace baseline.**

```powershell
git add package.json pnpm-workspace.yaml packages/shared .env.example
git commit -m "chore: bootstrap ArenaPay workspace"
```

### Task 2: Build the Soroban escrow state machine

**Files:**
- Create: `contracts/arena_escrow/src/lib.rs`
- Create: `contracts/arena_escrow/src/test.rs`
- Create: `contracts/arena_escrow/Cargo.toml`

**Interfaces:**
- Consumes: `match_id`, player addresses, buy-in, engine version, seed hash, and referee public key.
- Produces: `create_match`, `deposit`, `settle_match`, `cancel_match`, and `get_match` contract methods plus `created`, `funded`, `settled`, and `cancelled` events.

- [ ] **Step 1: Create the contract workspace and test target.**

```powershell
stellar contract init arenapay
Set-Location arenapay
stellar contract build --optimize=false
```

- [ ] **Step 2: Write the failing happy-path escrow test.**

```rust
#[test]
fn funds_two_players_and_pays_the_winner_once() {
    let env = Env::default();
    let contract_id = env.register(ArenaEscrow, ());
    let client = ArenaEscrowClient::new(&env, &contract_id);
    let token = env.register_stellar_asset_contract_v2(admin.clone());

    client.create_match(&match_id, &player_a, &player_b, &token.address, &100, &engine, &seed_hash, &referee);
    client.deposit(&match_id, &player_a);
    client.deposit(&match_id, &player_b);
    client.settle_match(&match_id, &player_a, &final_state_hash, &referee_signature);

    assert_eq!(client.get_match(&match_id).status, MatchStatus::Settled);
    assert_eq!(token_client.balance(&player_a), 200);
    assert_panics!(client.settle_match(&match_id, &player_a, &final_state_hash, &referee_signature));
}
```

- [ ] **Step 3: Run the contract test to verify it fails.**

Run: `cargo test -p arena_escrow funds_two_players_and_pays_the_winner_once`

Expected: FAIL because `ArenaEscrow` and its client methods do not exist.

- [ ] **Step 4: Implement the smallest explicit state machine.**

```rust
#[contracttype]
#[derive(Clone, Eq, PartialEq)]
pub enum MatchStatus { Created, Funded, Settled, Cancelled }

#[contracttype]
#[derive(Clone)]
pub struct MatchRecord {
    pub player_a: Address,
    pub player_b: Address,
    pub buy_in: i128,
    pub token: Address,
    pub engine_version: String,
    pub seed_hash: BytesN<32>,
    pub timeout_ledger: u32,
    pub final_state_hash: Option<BytesN<32>>,
    pub winner: Option<Address>,
    pub funded_a: bool,
    pub funded_b: bool,
    pub status: MatchStatus,
}
```

Implement `deposit` with `player.require_auth()` and token `transfer(player, contract, buy_in)`. Persist the match record and use `persistent().extend_ttl` on every write. Implement `settle_match` so it accepts only `Funded`, first confirms `winner == player_a || winner == player_b`, then verifies the configured referee Ed25519 signature over `SHA256("ARENAPAY_V1" || match_id || engine_version || seed_hash || winner_xdr || final_state_hash)`, transfers `buy_in * 2` to `winner`, changes status to `Settled`, and emits the final hash. Implement `cancel_match` only after `env.ledger().sequence() >= timeout_ledger`, returning only deposits that exist.

- [ ] **Step 5: Add failure-path tests before expanding the contract.**

```rust
#[test]
#[should_panic]
fn rejects_deposit_from_non_player() {
    let env = Env::default();
    let client = ArenaEscrowClient::new(&env, &env.register(ArenaEscrow, ()));
    client.deposit(&BytesN::from_array(&env, &[1; 32]), &env.generate_address());
}

#[test]
#[should_panic]
fn rejects_resolution_before_both_entries_are_funded() {
    let env = Env::default();
    let client = ArenaEscrowClient::new(&env, &env.register(ArenaEscrow, ()));
    client.settle_match(&BytesN::from_array(&env, &[2; 32]), &env.generate_address(), &BytesN::from_array(&env, &[3; 32]), &Bytes::new(&env));
}

#[test]
#[should_panic]
fn rejects_wrong_referee_signature() {
    let env = Env::default();
    let client = configured_funded_match(&env);
    client.settle_match(&MATCH_ID, &PLAYER_A, &FINAL_HASH, &Bytes::from_slice(&env, &[0; 64]));
}

#[test]
fn returns_only_existing_deposits_on_cancel() {
    let env = Env::default();
    let fixture = partially_funded_match(&env);
    fixture.client.cancel(&fixture.match_id);
    assert_eq!(fixture.token.balance(&fixture.player_a), 100);
    assert_eq!(fixture.client.get_match(&fixture.match_id).status, MatchStatus::Cancelled);
}

#[test]
#[should_panic]
fn rejects_a_winner_who_is_not_a_registered_player() {
    let env = Env::default();
    let fixture = configured_funded_match(&env);
    fixture.client.settle_match(&fixture.match_id, &env.generate_address(), &FINAL_HASH, &fixture.valid_signature);
}

#[test]
#[should_panic]
fn rejects_a_signature_for_a_different_engine_version() {
    let env = Env::default();
    let fixture = configured_funded_match(&env);
    let stale_signature = fixture.sign_for_engine_version("0.9.0");
    fixture.client.settle_match(&fixture.match_id, &fixture.player_a, &FINAL_HASH, &stale_signature);
}
```

- [ ] **Step 6: Run the full contract suite and build the Wasm.**

Run: `cargo test -p arena_escrow && stellar contract build`

Expected: PASS and `target/wasm32v1-none/release/arena_escrow.wasm` exists.

- [ ] **Step 7: Commit the escrow contract.**

```powershell
git add contracts/arena_escrow
git commit -m "feat: add Soroban tournament escrow"
```

### Task 3: Implement deterministic simulation and replay artifacts

**Files:**
- Create: `services/match-engine/src/simulation.ts`
- Create: `services/match-engine/test/simulation.test.ts`
- Modify: `packages/shared/src/contracts.ts`

**Interfaces:**
- Consumes: `seed: number`, `engineVersion: string`, and ordered moves.
- Produces: `runSimulation(seed, inputs): SimulationResult`, where `SimulationResult` includes `winner`, `finalStateHash`, and replayable final state.

- [ ] **Step 1: Write the failing determinism test.**

```ts
it("returns an identical hash for identical seed and inputs", () => {
  const inputs = [
    { tick: 0, player: "A", move: "RIGHT" },
    { tick: 0, player: "B", move: "LEFT" },
  ] as const;
  expect(runSimulation(42, inputs).finalStateHash)
    .toBe(runSimulation(42, inputs).finalStateHash);
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm --filter @arenapay/match-engine test simulation.test.ts`

Expected: FAIL because `runSimulation` does not exist.

- [ ] **Step 3: Implement a fixed grid, integer positions, and fixed tick count.**

```ts
export function runSimulation(seed: number, inputs: readonly MoveInput[]): SimulationResult {
  const state = { tick: 0, a: { x: 0, y: 0, score: 0 }, b: { x: 7, y: 7, score: 0 }, seed };
  for (let tick = 0; tick < 60; tick += 1) {
    applyOrderedMoves(state, inputs.filter((input) => input.tick === tick));
    collectDeterministicResource(state, tick);
    state.tick = tick + 1;
  }
  return { winner: state.a.score >= state.b.score ? "A" : "B", finalStateHash: sha256Hex(canonicalJson(state)), state };
}
```

Implement `chooseAggressiveMove(state)` for Agent A: prioritize the shortest Manhattan path to the rival, then fire when adjacent. Implement `chooseDefensiveMove(state)` for Agent B: maximize distance from the rival, then move toward the nearest resource. At match creation, save the two policy names and optional pre-match LLM configuration as immutable replay metadata; never call a model after tick zero.

- [ ] **Step 4: Add order, seed and boundary tests.**

```ts
it("sorts same-tick moves by player before applying them", () => {
  const moves = [{ tick: 0, player: "B", move: "LEFT" }, { tick: 0, player: "A", move: "RIGHT" }] as const;
  expect(runSimulation(1, moves).finalStateHash).toBe(runSimulation(1, [...moves].reverse()).finalStateHash);
});
it("changes the result when the seed changes", () => {
  const moves = [{ tick: 0, player: "A", move: "RIGHT" }] as const;
  expect(runSimulation(1, moves).finalStateHash).not.toBe(runSimulation(2, moves).finalStateHash);
});
it("keeps positions within the 8 by 8 grid", () => {
  const state = runSimulation(1, Array.from({ length: 60 }, (_, tick) => ({ tick, player: "A" as const, move: "LEFT" as const }))).state;
  expect(state.a.x).toBeGreaterThanOrEqual(0);
  expect(state.a.x).toBeLessThan(8);
});
```

- [ ] **Step 5: Run tests and commit.**

Run: `pnpm --filter @arenapay/match-engine test && git add services/match-engine packages/shared && git commit -m "feat: add deterministic ArenaPay simulation"`

Expected: PASS.

### Task 4: Add match lifecycle API and referee signing

**Files:**
- Create: `services/match-engine/src/match-service.ts`
- Create: `services/match-engine/src/referee.ts`
- Create: `services/match-engine/src/server.ts`
- Create: `services/match-engine/test/match-service.test.ts`

**Interfaces:**
- Consumes: a funded `MatchRecord` and valid replay inputs.
- Produces: `POST /matches`, `POST /matches/:id/run`, `GET /matches/:id`, `GET /matches/:id/replay`, and a signed `ResolutionPayload`.

- [ ] **Step 1: Write the failing replay lifecycle test.**

```ts
it("stores a replay and signs its final hash", async () => {
  const created = await service.createMatch(matchRequest);
  const result = await service.runMatch(created.matchId);
  expect(result.finalStateHash).toHaveLength(64);
  expect(await service.verifyResolution(result.resolution)).toBe(true);
  expect((await service.getReplay(created.matchId)).winner).toBeDefined();
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm --filter @arenapay/match-engine test match-service.test.ts`

Expected: FAIL because `MatchService` does not exist.

- [ ] **Step 3: Implement an in-memory lifecycle that is replaceable by storage.**

```ts
export class MatchService {
  private readonly matches = new Map<string, MatchRecord>();
  private readonly replays = new Map<string, Replay>();

  async runMatch(matchId: string): Promise<ResolutionPayload> {
    const match = this.requireFundedMatch(matchId);
    const replay = buildDemoReplay(match);
    this.replays.set(matchId, replay);
    return this.referee.sign({ matchId, winner: this.addressFor(replay.winner, match), finalStateHash: replay.finalStateHash });
  }
}
```

- [ ] **Step 4: Add HTTP validation that rejects all mismatched identifiers.**

```ts
server.post("/matches/:matchId/run", async (request, reply) => {
  const { matchId } = request.params as { matchId: string };
  const payload = await matchService.runMatch(matchId);
  return reply.code(200).send(payload);
});
```

Use a Zod schema for every JSON body, reject unknown fields, return `404` for absent matches, and return `409` for runs attempted before funding or after a replay exists.

- [ ] **Step 5: Add API tests for absent, un-funded and duplicate runs.**

```ts
it("returns 409 when a match is not funded", async () => {
  const response = await server.inject({ method: "POST", url: "/matches/not-funded/run" });
  expect(response.statusCode).toBe(409);
});
it("returns 409 when a match already has a replay", async () => {
  await service.runMatch("funded-match");
  const response = await server.inject({ method: "POST", url: "/matches/funded-match/run" });
  expect(response.statusCode).toBe(409);
});
it("returns 404 for an unknown match", async () => {
  const response = await server.inject({ method: "POST", url: "/matches/missing/run" });
  expect(response.statusCode).toBe(404);
});
```

- [ ] **Step 6: Run tests and commit.**

Run: `pnpm --filter @arenapay/match-engine test && git add services/match-engine && git commit -m "feat: add match API and referee signing"`

Expected: PASS.

### Task 5: Deploy to Testnet and automate contract initialization

**Files:**
- Create: `scripts/deploy-testnet.ts`
- Create: `scripts/fund-demo-accounts.ts`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: `DEPLOYER_SECRET_KEY`, token contract ID, and referee public key from local environment.
- Produces: initialized Testnet contract ID written only to local `.env` and printed to the terminal.

- [ ] **Step 1: Write a deployment script test against a mocked SDK adapter.**

```ts
it("initializes the contract with token and referee settings", async () => {
  await deploy({ deployWasm, invoke, tokenContractId: "C_TOKEN", referee: "G_REFEREE" });
  expect(invoke).toHaveBeenCalledWith("initialize", ["C_TOKEN", "G_REFEREE"]);
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm test scripts/deploy-testnet.test.ts`

Expected: FAIL because the deployment adapter does not exist.

- [ ] **Step 3: Implement deployment around the official Testnet path.**

```powershell
stellar keys generate arenapay-deployer --network testnet --fund
stellar contract deploy `
  --wasm contracts/arena_escrow/target/wasm32v1-none/release/arena_escrow.wasm `
  --source-account arenapay-deployer `
  --network testnet `
  --alias arenapay_escrow
```

The script must invoke `initialize(token_contract_id, referee_public_key)` immediately after deployment, print the resulting contract ID, and stop if that invocation fails. Store secrets only in an ignored local `.env` file.

- [ ] **Step 4: Fund two disposable demo accounts and establish required testnet balances.**

```ts
await fundTestnetAccount(playerA);
await fundTestnetAccount(playerB);
await ensureTokenBalance(playerA, tokenContractId, 1_000n);
await ensureTokenBalance(playerB, tokenContractId, 1_000n);
```

- [ ] **Step 5: Verify on Testnet using a real match creation and two deposits.**

Run: `pnpm tsx scripts/deploy-testnet.ts && pnpm tsx scripts/fund-demo-accounts.ts && pnpm test:e2e:testnet`

Expected: contract ID, both deposits confirmed, and one discoverable contract event.

- [ ] **Step 6: Commit deployment automation.**

```powershell
git add scripts .env.example README.md
git commit -m "feat: automate ArenaPay Testnet deployment"
```

### Task 6: Build the wallet and contract adapter

**Files:**
- Create: `apps/web/src/lib/stellar.ts`
- Create: `apps/web/src/lib/stellar.test.ts`
- Modify: `packages/shared/src/contracts.ts`

**Interfaces:**
- Consumes: connected wallet public address, contract ID, match ID, and buy-in.
- Produces: `connectWallet()`, `deposit(matchId)`, `settleMatch(payload)`, `getMatch(matchId)`, and transaction hash strings.

- [ ] **Step 1: Write the failing adapter test for deposit construction.**

```ts
it("builds a deposit invocation for the connected wallet", async () => {
  const wallet = fakeWallet("GPLAYERA");
  await deposit(wallet, "match-001");
  expect(wallet.signTransaction).toHaveBeenCalledOnce();
  expect(wallet.submitTransaction).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm --filter @arenapay/web test stellar.test.ts`

Expected: FAIL because `deposit` does not exist.

- [ ] **Step 3: Implement a narrow wallet interface and one contract invocation per method.**

```ts
export interface WalletAdapter {
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, options: { networkPassphrase: string }): Promise<string>;
  submitTransaction(xdr: string): Promise<{ hash: string }>;
}

export async function deposit(wallet: WalletAdapter, matchId: string): Promise<string> {
  const source = await wallet.getPublicKey();
  const xdr = await buildContractInvocation("deposit", [matchId, source]);
  const signed = await wallet.signTransaction(xdr, { networkPassphrase: Networks.TESTNET });
  return (await wallet.submitTransaction(signed)).hash;
}
```

- [ ] **Step 4: Add failures for missing wallet, rejected signature, and contract simulation error.**

```ts
it("surfaces a wallet rejection without retrying", async () => {
  const wallet = fakeWallet("GPLAYERA", { signError: new Error("User rejected") });
  await expect(deposit(wallet, "match-001")).rejects.toThrow("User rejected");
  expect(wallet.submitTransaction).not.toHaveBeenCalled();
});
it("does not submit when simulation reports a contract error", async () => {
  const wallet = fakeWallet("GPLAYERA");
  mockBuildContractInvocation.mockRejectedValue(new Error("contract simulation failed"));
  await expect(deposit(wallet, "match-001")).rejects.toThrow("contract simulation failed");
  expect(wallet.submitTransaction).not.toHaveBeenCalled();
});
```

- [ ] **Step 5: Run tests and commit.**

Run: `pnpm --filter @arenapay/web test && git add apps/web/src/lib packages/shared && git commit -m "feat: add Stellar wallet adapter"`

Expected: PASS.

### Task 7: Build the three-minute demo interface

**Files:**
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/components/Arena.tsx`
- Create: `apps/web/src/components/MatchCard.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/App.test.tsx`

**Interfaces:**
- Consumes: `MatchRecord`, `Replay`, match API responses, and wallet adapter methods.
- Produces: a single screen that shows funding, match progress, replay hash, contract transaction, and winner payout.

- [ ] **Step 1: Write the failing UI state test.**

```tsx
it("shows the payout link after a resolved match", async () => {
  render(<App matchApi={resolvedMatchApi} wallet={fakeWallet("GPLAYERA")} />);
  expect(await screen.findByText("Premio liquidado")).toBeVisible();
  expect(screen.getByRole("link", { name: /ver transacción/i })).toHaveAttribute("href", expect.stringContaining("stellar.expert"));
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm --filter @arenapay/web test App.test.tsx`

Expected: FAIL because `App` does not exist.

- [ ] **Step 3: Implement the visible demo states in this exact order.**

```tsx
const stages = ["Crear partida", "Depositar A", "Depositar B", "Ejecutar simulación", "Liquidar premio"];
```

The page must always show the current stage, the two participant addresses in shortened form, buy-in, deterministic seed commitment, final hash once available, and a Testnet explorer link once a transaction exists. For the active agent, also show token autorizado, gasto máximo, torneo permitido, expiración y gasto utilizado. Include a visible rejected attempt where a request above the configured allowance returns `Presupuesto excedido`. Do not render a “winner” until `status === "Settled"`.

- [ ] **Step 4: Implement replay controls that never change the authoritative result.**

```tsx
<button onClick={() => setTick((current) => Math.max(0, current - 1))}>Anterior</button>
<button onClick={() => setTick((current) => Math.min(replay.inputs.length, current + 1))}>Siguiente</button>
```

Use replay inputs returned by the API; never recompute or overwrite the stored final hash in the browser.

- [ ] **Step 5: Add a one-click reproducibility check.**

```tsx
const reproduced = runSimulation(replay.seed, replay.inputs);
setVerification(reproduced.finalStateHash === replay.finalStateHash ? "match" : "mismatch");
```

Display `Hash coincide 100%` only when the browser-produced hash equals both the replay hash and the `final_state_hash` read from the contract. Display `Evidencia inconsistente` otherwise and disable the settle button.

- [ ] **Step 6: Add UI tests for pre-funding, simulation failure, and wallet rejection.**

```tsx
it("disables run until both deposits are confirmed", () => {
  render(<App matchApi={oneDepositApi} wallet={fakeWallet("GPLAYERA")} />);
  expect(screen.getByRole("button", { name: "Ejecutar simulación" })).toBeDisabled();
});
it("shows a retry-safe failure when the engine returns 409", async () => {
  render(<App matchApi={conflictApi} wallet={fakeWallet("GPLAYERA")} />);
  await userEvent.click(screen.getByRole("button", { name: "Ejecutar simulación" }));
  expect(await screen.findByText("La partida ya se ejecutó o aún no está financiada.")).toBeVisible();
});
it("keeps stage unchanged after wallet rejection", async () => {
  render(<App matchApi={createdMatchApi} wallet={rejectingWallet} />);
  await userEvent.click(screen.getByRole("button", { name: "Depositar A" }));
  expect(await screen.findByText("Crear partida")).toBeVisible();
});
```

- [ ] **Step 7: Run web tests and commit.**

Run: `pnpm --filter @arenapay/web test && pnpm --filter @arenapay/web build && git add apps/web && git commit -m "feat: add ArenaPay demo interface"`

Expected: PASS and a production web bundle.

### Task 8: Perform the full Testnet rehearsal and prepare submission evidence

**Files:**
- Modify: `README.md`
- Create: `docs/demo-script.md`
- Create: `docs/verification.md`
- Create: `tests/e2e/arena-flow.spec.ts`

**Interfaces:**
- Consumes: deployed Testnet contract, two funded demo wallets, referee key, engine API, and web app.
- Produces: a repeatable end-to-end run, a three-minute verbal demo script, and links to Testnet evidence.

- [ ] **Step 1: Write the failing browser flow test.**

```ts
test("funds, runs, resolves and exposes evidence", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await page.getByRole("button", { name: "Depositar A" }).click();
  await page.getByRole("button", { name: "Depositar B" }).click();
  await page.getByRole("button", { name: "Ejecutar simulación" }).click();
  await expect(page.getByText("Premio liquidado")).toBeVisible();
  await expect(page.getByRole("link", { name: /ver transacción/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails before services are running.**

Run: `pnpm exec playwright test tests/e2e/arena-flow.spec.ts`

Expected: FAIL because the web service is unavailable.

- [ ] **Step 3: Start the engine and web app with fixed local ports.**

```powershell
pnpm --filter @arenapay/match-engine dev
pnpm --filter @arenapay/web dev -- --port 5173
```

- [ ] **Step 4: Execute the flow against the deployed Testnet contract.**

Run: `pnpm test:e2e:testnet`

Expected: PASS with a unique match ID, exactly one resolution event, one payout transaction, and a stored replay whose hash equals the event hash.

- [ ] **Step 5: Write the Demo Day sequence with timestamps.**

```markdown
00:00 - Problema: agentes necesitan competir y cobrar bajo reglas verificables.
00:25 - Crear partida y mostrar el escrow Soroban.
00:50 - Confirmar los dos buy-ins en Stellar Testnet.
01:20 - Ejecutar la partida y mostrar el replay determinista.
01:55 - Mostrar hash final y firma del árbitro de testnet.
02:20 - Liquidar el premio y abrir la transacción verificable.
02:45 - Cerrar con límites: MVP sin lending ni fondos reales.
```

- [ ] **Step 6: Document exact verification links and limitations.**

```markdown
- Contract ID: `C...`
- Resolution transaction: `https://stellar.expert/explorer/testnet/tx/<hash>`
- Replay SHA-256: `<hash>`
- Limitation: one testnet referee signs results; decentralized dispute resolution is post-MVP.
- Fallback: video Testnet de 90 segundos, grabado con el mismo contract ID y flujo de evidencia.
- RPC primario y respaldo: dos URLs configuradas, con conmutación solo para consultas; la transacción muestra error explícito si ambos RPC fallan.
```

Add these README sections before recording the video: value statement; testnet contract ID; one verified transaction link; four-state diagram; replay format and deterministic runtime rules; explicit single-referee trade-off; known limitations and roadmap; and a statement that the repository contains no private keys or production credentials.

- [ ] **Step 7: Run the full quality gate and commit.**

Run: `cargo test -p arena_escrow && pnpm -r test && pnpm -r build && pnpm test:e2e:testnet`

Expected: all commands PASS before recording the final video.

```powershell
git add README.md docs tests
git commit -m "docs: add ArenaPay Testnet demo runbook"
```

## Spec Coverage Review

- Two-agent deterministic competition: Tasks 3, 4, and 7.
- Buy-in escrow and atomic payout: Task 2 and Task 5.
- Testnet-verifiable contract or transaction: Task 5 and Task 8.
- Replay, final hash, engine version, and evidence: Tasks 3, 4, 7, and 8.
- Bounded agent authorization and no key custody: Task 6 and the global constraints.
- Explicitly deferred lending, P2P consensus, and real funds: global constraints, Task 2 boundaries, and Task 8 limitations.

## Sources

- [Stellar Docs: Set up and configure smart contract development](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Stellar Docs: Write, test, and build a Rust smart contract](https://developers.stellar.org/docs/build/smart-contracts/getting-started/hello-world)
- [Stellar Docs: Deploy and debug contracts on Testnet](https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet)
- [Stellar Docs: Smart-contract events](https://developers.stellar.org/docs/build/smart-contracts/example-contracts/events)
- [Stellar Odyssey Perú](https://stellar.mintedinpe.com/odyssey)
