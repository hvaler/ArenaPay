extern crate std;
use super::*;
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::{testutils::{Address as _, Ledger, Events}, xdr};

struct Fixture {
    env: Env, contract: Address, admin: Address, a: Address, b: Address,
    token: Address, key: SigningKey, id: BytesN<32>, hash: BytesN<32>,
}
impl Fixture {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        let network: BytesN<32> = env.crypto().sha256(&Bytes::from_slice(&env, TESTNET)).into();
        env.ledger().with_mut(|ledger| { ledger.sequence_number = 100; ledger.network_id = network.to_array(); });
        let admin = Address::generate(&env); let a = Address::generate(&env); let b = Address::generate(&env);
        let token = env.register_stellar_asset_contract_v2(admin.clone()).address();
        let key = SigningKey::from_bytes(&[7; 32]);
        let referee = BytesN::from_array(&env, &key.verifying_key().to_bytes());
        let contract = env.register(ArenaEscrow, (&admin, &token, &referee));
        let id = BytesN::from_array(&env, &[1; 32]); let hash = BytesN::from_array(&env, &[9; 32]);
        let client = ArenaEscrowClient::new(&env, &contract);
        client.authorize_budget(&a, &300, &1000); client.authorize_budget(&b, &300, &1000);
        token::StellarAssetClient::new(&env, &token).mint(&a, &1000);
        token::StellarAssetClient::new(&env, &token).mint(&b, &1000);
        Self { env, contract, admin, a, b, token, key, id, hash }
    }
    fn client(&self) -> ArenaEscrowClient<'_> { ArenaEscrowClient::new(&self.env, &self.contract) }
    fn create(&self) { self.client().create_match(&self.id, &self.a, &self.b, &100,
        &String::from_str(&self.env, "resource-arena/1.0.0"), &BytesN::from_array(&self.env, &[2;32]), &200); }
    fn fund(&self) { self.create(); self.client().deposit(&self.id, &self.a); self.client().deposit(&self.id, &self.b); }
    fn signature(&self, winner: &Address) -> BytesN<64> {
        let record = self.client().get_match(&self.id);
        let message = self.env.as_contract(&self.contract, || digest(&self.env, &self.id, &record, winner, &self.hash));
        BytesN::from_array(&self.env, &self.key.sign(&message.to_array()).to_bytes())
    }
    fn balance(&self, player: &Address) -> i128 { token::Client::new(&self.env, &self.token).balance(player) }
    fn expire(&self) { self.env.ledger().with_mut(|ledger| ledger.sequence_number = 200); }
}

#[test]
fn pays_exactly_once_and_emits_evidence() {
    let f = Fixture::new(); f.fund();
    assert_eq!(f.balance(&f.contract), 200);
    let signature = f.signature(&f.a);
    f.client().settle_match(&f.id, &f.a, &f.hash, &signature);
    let events = f.env.events().all().filter_by_contract(&f.contract);
    let xdr::ContractEventBody::V0(body) = &events.events().last().unwrap().body;
    assert_eq!(body.topics[0], xdr::ScVal::Symbol("settled".try_into().unwrap()));
    assert_eq!(f.balance(&f.a), 1100); assert_eq!(f.balance(&f.b), 900); assert_eq!(f.balance(&f.contract), 0);
    let result = f.client().get_match(&f.id);
    assert_eq!(result.status, MatchStatus::Settled); assert_eq!(result.winner, Some(f.a.clone()));
    assert_eq!(result.final_state_hash, Some(f.hash.clone()));
    assert!(f.client().try_settle_match(&f.id, &f.a, &f.hash, &signature).is_err());
    assert_eq!(f.balance(&f.a), 1100);
}

#[test]
fn rejects_invalid_signature_without_moving_funds() {
    let f = Fixture::new(); f.fund();
    assert!(f.client().try_settle_match(&f.id, &f.a, &f.hash, &BytesN::from_array(&f.env, &[0;64])).is_err());
    assert_eq!(f.balance(&f.contract), 200); assert_eq!(f.client().get_match(&f.id).status, MatchStatus::Funded);
}

#[test]
fn rejects_other_winner_and_mutated_final_hash() {
    let f = Fixture::new(); f.fund(); let signature = f.signature(&f.a);
    assert!(f.client().try_settle_match(&f.id, &f.b, &f.hash, &signature).is_err());
    assert!(f.client().try_settle_match(&f.id, &f.admin, &f.hash, &signature).is_err());
    assert!(f.client().try_settle_match(&f.id, &f.a, &BytesN::from_array(&f.env, &[3;32]), &signature).is_err());
    assert_eq!(f.balance(&f.contract), 200);
}

#[test]
fn prevents_signature_reuse_between_contracts() {
    let f = Fixture::new(); f.fund(); let signature = f.signature(&f.a);
    let referee = BytesN::from_array(&f.env, &f.key.verifying_key().to_bytes());
    let other = f.env.register(ArenaEscrow, (&f.admin, &f.token, &referee));
    let client = ArenaEscrowClient::new(&f.env, &other);
    client.authorize_budget(&f.a, &300, &1000); client.authorize_budget(&f.b, &300, &1000);
    client.create_match(&f.id, &f.a, &f.b, &100, &String::from_str(&f.env, "resource-arena/1.0.0"), &BytesN::from_array(&f.env, &[2;32]), &200);
    client.deposit(&f.id, &f.a); client.deposit(&f.id, &f.b);
    assert!(client.try_settle_match(&f.id, &f.a, &f.hash, &signature).is_err());
    assert_eq!(f.balance(&other), 200);
}

#[test]
fn rejects_duplicate_or_unrelated_deposits_and_ids() {
    let f = Fixture::new(); f.create();
    assert!(f.client().try_deposit(&f.id, &f.admin).is_err());
    f.client().deposit(&f.id, &f.a);
    assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    assert_eq!(f.balance(&f.a), 900);
    assert!(f.client().try_create_match(&f.id, &f.a, &f.b, &100, &String::from_str(&f.env, "v1"), &f.hash, &200).is_err());
}

#[test]
fn does_not_settle_with_one_deposit() {
    let f = Fixture::new(); f.create(); f.client().deposit(&f.id, &f.a);
    assert!(f.client().try_settle_match(&f.id, &f.a, &f.hash, &f.signature(&f.a)).is_err());
    assert_eq!(f.balance(&f.contract), 100);
}

#[test]
fn refunds_exactly_the_received_deposits_after_timeout() {
    for deposits in 0..=2 {
        let f = Fixture::new(); f.create();
        if deposits > 0 { f.client().deposit(&f.id, &f.a); }
        if deposits > 1 { f.client().deposit(&f.id, &f.b); }
        assert!(f.client().try_cancel_match(&f.id, &f.a).is_err());
        f.expire();
        assert!(f.client().try_cancel_match(&f.id, &f.admin).is_err());
        f.client().cancel_match(&f.id, &f.b);
        assert_eq!(f.balance(&f.a), 1000); assert_eq!(f.balance(&f.b), 1000); assert_eq!(f.balance(&f.contract), 0);
        assert_eq!(f.client().get_match(&f.id).status, MatchStatus::Cancelled);
        assert!(f.client().try_cancel_match(&f.id, &f.a).is_err());
        assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    }
}

#[test]
fn expired_funded_match_cannot_settle_and_settled_match_cannot_cancel() {
    let f = Fixture::new(); f.fund(); let signature = f.signature(&f.a); f.expire();
    assert!(f.client().try_settle_match(&f.id, &f.a, &f.hash, &signature).is_err());
    let g = Fixture::new(); g.fund(); g.client().settle_match(&g.id, &g.a, &g.hash, &g.signature(&g.a)); g.expire();
    assert!(g.client().try_cancel_match(&g.id, &g.a).is_err());
}

#[test]
fn enforces_budget_without_spending_on_failure() {
    let f = Fixture::new(); f.create(); f.client().authorize_budget(&f.a, &99, &1000);
    assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    assert_eq!(f.balance(&f.a), 1000); assert_eq!(f.client().get_budget(&f.a).unwrap().spent, 0);
    f.client().authorize_budget(&f.a, &100, &1000); f.client().deposit(&f.id, &f.a);
    f.client().authorize_budget(&f.a, &100, &1000);
    assert_eq!(f.client().get_budget(&f.a).unwrap().spent, 100);
    f.expire(); f.client().cancel_match(&f.id, &f.a);
    assert_eq!(f.client().get_budget(&f.a).unwrap().spent, 100);
}

#[test]
fn token_failure_rolls_back_budget_and_deposit() {
    let f = Fixture::new(); f.create();
    token::Client::new(&f.env, &f.token).transfer(&f.a, &f.admin, &1000);
    assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    assert_eq!(f.client().get_budget(&f.a).unwrap().spent, 0);
    assert!(!f.client().get_match(&f.id).funded_a);
}

#[test]
fn rejects_invalid_creation_parameters() {
    let f = Fixture::new(); let v = String::from_str(&f.env, "v1");
    for amount in [0, -1, i128::MAX] {
        assert!(f.client().try_create_match(&f.id, &f.a, &f.b, &amount, &v, &f.hash, &200).is_err());
    }
    assert!(f.client().try_create_match(&f.id, &f.a, &f.a, &100, &v, &f.hash, &200).is_err());
    assert!(f.client().try_create_match(&f.id, &f.a, &f.b, &100, &v, &f.hash, &100).is_err());
    assert!(f.client().try_create_match(&f.id, &f.a, &f.b, &100, &v, &f.hash, &20_000).is_err());
}

#[test]
fn requires_real_authorization_for_admin_player_and_budget() {
    let f = Fixture::new(); f.create(); f.env.mock_auths(&[]);
    assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    assert!(f.client().try_authorize_budget(&f.a, &900, &1000).is_err());
    assert!(f.client().try_create_match(&BytesN::from_array(&f.env, &[4;32]), &f.a, &f.b, &100, &String::from_str(&f.env, "v1"), &f.hash, &200).is_err());
    f.expire(); assert!(f.client().try_cancel_match(&f.id, &f.a).is_err());
}

#[test]
fn reads_extend_persistent_match_ttl() {
    let f = Fixture::new(); f.create();
    let key = Key::Match(f.id.clone());
    use soroban_sdk::testutils::storage::Persistent;
    let before = f.env.as_contract(&f.contract, || f.env.storage().persistent().get_ttl(&key));
    f.env.ledger().with_mut(|ledger| ledger.sequence_number += before - TTL_THRESHOLD + 1);
    f.client().get_match(&f.id);
    let after = f.env.as_contract(&f.contract, || f.env.storage().persistent().get_ttl(&key));
    assert!(after > TTL_THRESHOLD);
}

#[test]
fn matches_typescript_xdr_and_signature_vector() {
    let fixture: serde_json::Value = serde_json::from_str(include_str!("../../../../docs/evidencia/fixtures/resolution-v2.json")).unwrap();
    let env = Env::default();
    let network: BytesN<32> = env.crypto().sha256(&Bytes::from_slice(&env, TESTNET)).into();
    env.ledger().with_mut(|ledger| ledger.network_id = network.to_array());
    let address = Address::from_string(&String::from_str(&env, fixture["contractId"].as_str().unwrap()));
    env.register_at(&address, ArenaEscrow, (Address::generate(&env), Address::generate(&env), BytesN::from_array(&env, &[1;32])));
    let winner = Address::from_string(&String::from_str(&env, fixture["winner"].as_str().unwrap()));
    let record = MatchRecord { player_a: winner.clone(), player_b: Address::generate(&env), buy_in: 100,
        engine_version: String::from_str(&env, "resource-arena/1.0.0"), seed_hash: BytesN::from_array(&env, &[0x22;32]),
        timeout_ledger: 100, funded_a: true, funded_b: true, status: MatchStatus::Funded, winner: None, final_state_hash: None };
    let computed = env.as_contract(&address, || digest(&env, &BytesN::from_array(&env, &[0x11;32]), &record, &winner, &BytesN::from_array(&env, &[0x33;32])));
    assert_eq!(hex::encode(computed.to_array()), fixture["digest"].as_str().unwrap());
    let key: [u8;32] = hex::decode(fixture["refereePublicKey"].as_str().unwrap()).unwrap().try_into().unwrap();
    let signature: [u8;64] = hex::decode(fixture["signature"].as_str().unwrap()).unwrap().try_into().unwrap();
    env.crypto().ed25519_verify(&BytesN::from_array(&env, &key), &Bytes::from(computed), &BytesN::from_array(&env, &signature));
}

#[test]
#[should_panic]
fn refuses_deployment_on_other_networks() {
    let env = Env::default();
    env.register(ArenaEscrow, (Address::generate(&env), Address::generate(&env), BytesN::from_array(&env, &[1;32])));
}

#[test]
fn budget_expiry_and_missing_budget_prevent_deposits() {
    let f = Fixture::new(); f.create();
    f.client().authorize_budget(&f.a, &300, &101);
    f.env.ledger().with_mut(|ledger| ledger.sequence_number = 101);
    assert!(f.client().try_deposit(&f.id, &f.a).is_err());
    f.env.as_contract(&f.contract, || f.env.storage().persistent().remove(&Key::Budget(f.b.clone())));
    assert!(f.client().try_deposit(&f.id, &f.b).is_err());
    assert_eq!(f.balance(&f.contract), 0);
}
