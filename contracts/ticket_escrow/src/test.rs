#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    token, Address, Env, Symbol,
};

#[test]
fn test_escrow_initialization_and_getters() {
    let env = Env::default();
    env.mock_all_auths();

    let manager = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = TicketEscrowClient::new(&env, &escrow_address);

    escrow_client.initialize(&manager, &token_address);

    assert_eq!(escrow_client.get_manager(), manager);
    assert_eq!(escrow_client.get_token(), token_address);
}

#[test]
fn test_escrow_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let manager = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = TicketEscrowClient::new(&env, &escrow_address);

    escrow_client.initialize(&manager, &token_address);

    let recipient = Address::generate(&env);
    let buyer = Address::generate(&env);
    
    // Mint tokens to escrow so it has funds to pay out/refund later
    token_admin_client.mint(&escrow_address, &200);

    // Setup escrow for event 1
    escrow_client.setup_escrow(&1, &recipient);

    let escrow_info = escrow_client.get_escrow_info(&1);
    assert_eq!(escrow_info.recipient, recipient);
    assert_eq!(escrow_info.balance, 0);
    assert_eq!(escrow_info.status, 0);

    // Record deposit
    escrow_client.record_deposit(&1, &buyer, &200);

    assert_eq!(escrow_client.get_buyer_deposit(&1, &buyer), 200);
    assert_eq!(escrow_client.get_escrow_info(&1).balance, 200);

    // Release payout
    escrow_client.release_payout(&1);

    assert_eq!(token_client.balance(&recipient), 200);
    assert_eq!(escrow_client.get_escrow_info(&1).status, 1); // Completed
}

#[test]
#[should_panic(expected = "Escrow is not in refundable state")]
fn test_refund_fails_in_active_state() {
    let env = Env::default();
    env.mock_all_auths();

    let manager = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = TicketEscrowClient::new(&env, &escrow_address);

    escrow_client.initialize(&manager, &token_address);

    let recipient = Address::generate(&env);
    let buyer = Address::generate(&env);

    escrow_client.setup_escrow(&1, &recipient);
    escrow_client.record_deposit(&1, &buyer, &100);

    // Try refund (should panic because not cancelled)
    escrow_client.refund_buyer(&1, &buyer, &100);
}

#[test]
fn test_refund_success() {
    let env = Env::default();
    env.mock_all_auths();

    let manager = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = TicketEscrowClient::new(&env, &escrow_address);

    escrow_client.initialize(&manager, &token_address);

    let recipient = Address::generate(&env);
    let buyer = Address::generate(&env);

    token_admin_client.mint(&escrow_address, &100);

    escrow_client.setup_escrow(&1, &recipient);
    escrow_client.record_deposit(&1, &buyer, &100);

    escrow_client.enable_refunds(&1);
    assert_eq!(escrow_client.get_escrow_info(&1).status, 2); // Cancelled

    escrow_client.refund_buyer(&1, &buyer, &100);
    assert_eq!(token_client.balance(&buyer), 100);
}
