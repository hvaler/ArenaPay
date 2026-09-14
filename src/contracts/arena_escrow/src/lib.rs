#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, panic_with_error,
    symbol_short, token, xdr::ToXdr, Address, Bytes, BytesN, Env, String, Symbol};

const TESTNET: &[u8] = b"Test SDF Network ; September 2015";
const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND: u32 = 518_400;
const MAX_TIMEOUT: u32 = 17_280;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    Missing = 1, AlreadyExists = 2, InvalidPlayers = 3, InvalidAmount = 4,
    InvalidTimeout = 5, InvalidVersion = 6, InvalidState = 7, NotPlayer = 8,
    AlreadyDeposited = 9, Expired = 10, TooEarly = 11, InvalidWinner = 12,
    TestnetOnly = 13, InvalidReferee = 14, BudgetMissing = 15, BudgetExceeded = 16,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MatchStatus { Created, Funded, Settled, Cancelled }

#[contracttype]
#[derive(Clone)]
pub struct Config { pub admin: Address, pub token: Address, pub referee: BytesN<32> }

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Budget { pub maximum: i128, pub spent: i128, pub expires_ledger: u32 }

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchRecord {
    pub player_a: Address, pub player_b: Address, pub buy_in: i128,
    pub engine_version: String, pub seed_hash: BytesN<32>, pub timeout_ledger: u32,
    pub funded_a: bool, pub funded_b: bool, pub status: MatchStatus,
    pub winner: Option<Address>, pub final_state_hash: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone)]
enum Key { Config, Match(BytesN<32>), Budget(Address) }

fn touch(env: &Env, key: &Key) { env.storage().persistent().extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND); }
fn config(env: &Env) -> Config {
    let value = env.storage().persistent().get(&Key::Config).unwrap_or_else(|| panic_with_error!(env, Error::Missing));
    touch(env, &Key::Config); value
}
fn read_match(env: &Env, id: &BytesN<32>) -> MatchRecord {
    let key = Key::Match(id.clone());
    let value = env.storage().persistent().get(&key).unwrap_or_else(|| panic_with_error!(env, Error::Missing));
    touch(env, &key); value
}
fn save_match(env: &Env, id: &BytesN<32>, record: &MatchRecord) {
    let key = Key::Match(id.clone());
    env.storage().persistent().set(&key, record); touch(env, &key);
}

/// XDR ScVal tuple, not ambiguous byte concatenation. Binds network and deployment.
fn digest(env: &Env, id: &BytesN<32>, record: &MatchRecord, winner: &Address, final_hash: &BytesN<32>) -> BytesN<32> {
    let payload = (Symbol::new(env, "ARENAPAY_V2"), env.ledger().network_id(), env.current_contract_address(),
        id.clone(), record.engine_version.clone(), record.seed_hash.clone(), winner.clone(), final_hash.clone()).to_xdr(env);
    env.crypto().sha256(&payload).into()
}

#[contract]
pub struct ArenaEscrow;

#[contractimpl]
impl ArenaEscrow {
    pub fn __constructor(env: Env, admin: Address, token: Address, referee: BytesN<32>) {
        let expected: BytesN<32> = env.crypto().sha256(&Bytes::from_slice(&env, TESTNET)).into();
        if env.ledger().network_id() != expected { panic_with_error!(&env, Error::TestnetOnly); }
        if referee == BytesN::from_array(&env, &[0; 32]) { panic_with_error!(&env, Error::InvalidReferee); }
        // Constructor arguments are committed atomically by the deployment transaction.
        env.storage().persistent().set(&Key::Config, &Config { admin, token, referee });
        touch(&env, &Key::Config);
    }

    pub fn get_config(env: Env) -> Config { config(&env) }

    /// Owner-signed authorization scoped to this escrow/token. Renewal never resets spent.
    pub fn authorize_budget(env: Env, player: Address, maximum: i128, expires_ledger: u32) {
        player.require_auth();
        if maximum < 0 { panic_with_error!(&env, Error::InvalidAmount); }
        let now = env.ledger().sequence();
        if expires_ledger <= now || expires_ledger - now > MAX_TIMEOUT { panic_with_error!(&env, Error::InvalidTimeout); }
        let key = Key::Budget(player.clone());
        let previous: Option<Budget> = env.storage().persistent().get(&key);
        let spent = previous.map(|budget| budget.spent).unwrap_or(0);
        env.storage().persistent().set(&key, &Budget { maximum, spent, expires_ledger });
        touch(&env, &key);
        env.events().publish((symbol_short!("budget"), player), (maximum, spent, expires_ledger));
    }

    pub fn get_budget(env: Env, player: Address) -> Option<Budget> {
        let key = Key::Budget(player);
        let value = env.storage().persistent().get(&key);
        if value.is_some() { touch(&env, &key); } value
    }

    pub fn create_match(env: Env, id: BytesN<32>, player_a: Address, player_b: Address,
        buy_in: i128, engine_version: String, seed_hash: BytesN<32>, timeout_ledger: u32) {
        config(&env).admin.require_auth();
        if env.storage().persistent().has(&Key::Match(id.clone())) { panic_with_error!(&env, Error::AlreadyExists); }
        if player_a == player_b || player_a == env.current_contract_address() || player_b == env.current_contract_address() {
            panic_with_error!(&env, Error::InvalidPlayers);
        }
        if buy_in <= 0 || buy_in > i128::MAX / 2 { panic_with_error!(&env, Error::InvalidAmount); }
        let now = env.ledger().sequence();
        if timeout_ledger <= now || timeout_ledger - now > MAX_TIMEOUT { panic_with_error!(&env, Error::InvalidTimeout); }
        if engine_version.len() == 0 || engine_version.len() > 64 { panic_with_error!(&env, Error::InvalidVersion); }
        save_match(&env, &id, &MatchRecord { player_a, player_b, buy_in, engine_version, seed_hash,
            timeout_ledger, funded_a: false, funded_b: false, status: MatchStatus::Created,
            winner: None, final_state_hash: None });
        env.events().publish((symbol_short!("created"), id), timeout_ledger);
    }

    pub fn get_match(env: Env, id: BytesN<32>) -> MatchRecord { read_match(&env, &id) }

    pub fn deposit(env: Env, id: BytesN<32>, player: Address) {
        player.require_auth();
        let cfg = config(&env);
        let mut record = read_match(&env, &id);
        if record.status != MatchStatus::Created { panic_with_error!(&env, Error::InvalidState); }
        if env.ledger().sequence() >= record.timeout_ledger { panic_with_error!(&env, Error::Expired); }
        if player == record.player_a {
            if record.funded_a { panic_with_error!(&env, Error::AlreadyDeposited); } record.funded_a = true;
        } else if player == record.player_b {
            if record.funded_b { panic_with_error!(&env, Error::AlreadyDeposited); } record.funded_b = true;
        } else { panic_with_error!(&env, Error::NotPlayer); }
        let key = Key::Budget(player.clone());
        let mut budget: Budget = env.storage().persistent().get(&key).unwrap_or_else(|| panic_with_error!(&env, Error::BudgetMissing));
        if env.ledger().sequence() >= budget.expires_ledger { panic_with_error!(&env, Error::Expired); }
        let spent = budget.spent.checked_add(record.buy_in).unwrap_or_else(|| panic_with_error!(&env, Error::BudgetExceeded));
        if spent > budget.maximum { panic_with_error!(&env, Error::BudgetExceeded); }
        budget.spent = spent;
        env.storage().persistent().set(&key, &budget); touch(&env, &key);
        if record.funded_a && record.funded_b { record.status = MatchStatus::Funded; }
        save_match(&env, &id, &record);
        token::Client::new(&env, &cfg.token).transfer(&player, &env.current_contract_address(), &record.buy_in);
        env.events().publish((symbol_short!("deposit"), id.clone(), player), record.buy_in);
        if record.status == MatchStatus::Funded { env.events().publish((symbol_short!("funded"), id), record.buy_in * 2); }
    }

    pub fn settle_match(env: Env, id: BytesN<32>, winner: Address, final_state_hash: BytesN<32>, signature: BytesN<64>) {
        let cfg = config(&env);
        let mut record = read_match(&env, &id);
        if record.status != MatchStatus::Funded { panic_with_error!(&env, Error::InvalidState); }
        if env.ledger().sequence() >= record.timeout_ledger { panic_with_error!(&env, Error::Expired); }
        if winner != record.player_a && winner != record.player_b { panic_with_error!(&env, Error::InvalidWinner); }
        let message = digest(&env, &id, &record, &winner, &final_state_hash);
        env.crypto().ed25519_verify(&cfg.referee, &Bytes::from(message), &signature);
        record.status = MatchStatus::Settled;
        record.winner = Some(winner.clone()); record.final_state_hash = Some(final_state_hash.clone());
        save_match(&env, &id, &record);
        token::Client::new(&env, &cfg.token).transfer(&env.current_contract_address(), &winner, &(record.buy_in * 2));
        env.events().publish((symbol_short!("settled"), id), (winner, final_state_hash));
    }

    pub fn cancel_match(env: Env, id: BytesN<32>, player: Address) {
        player.require_auth();
        let cfg = config(&env);
        let mut record = read_match(&env, &id);
        if player != record.player_a && player != record.player_b { panic_with_error!(&env, Error::NotPlayer); }
        if record.status != MatchStatus::Created && record.status != MatchStatus::Funded { panic_with_error!(&env, Error::InvalidState); }
        if env.ledger().sequence() < record.timeout_ledger { panic_with_error!(&env, Error::TooEarly); }
        record.status = MatchStatus::Cancelled; save_match(&env, &id, &record);
        let client = token::Client::new(&env, &cfg.token);
        // Budgets track gross authorized spend. Refunds never silently reauthorize spending.
        if record.funded_a { client.transfer(&env.current_contract_address(), &record.player_a, &record.buy_in); }
        if record.funded_b { client.transfer(&env.current_contract_address(), &record.player_b, &record.buy_in); }
        env.events().publish((symbol_short!("cancelled"), id), (record.funded_a, record.funded_b));
    }
}

#[cfg(test)]
mod test;
