#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    Address, Env, IntoVal, String, Vec,
};
use ticket_escrow::TicketEscrow;

#[test]
fn test_ticketchain_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // Generate addresses
    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let verifier = Address::generate(&env);
    let receiver = Address::generate(&env);

    // Register Token Contract (Stellar Asset Contract)
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Mint tokens to buyer
    let initial_balance = 1000i128;
    token_admin_client.mint(&buyer, &initial_balance);
    assert_eq!(token_client.balance(&buyer), initial_balance);

    // Register TicketEscrow contract
    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = ticket_escrow::TicketEscrowClient::new(&env, &escrow_address);

    // Register TicketManager contract
    let manager_address = env.register_contract(None, TicketManager);
    let manager_client = TicketManagerClient::new(&env, &manager_address);

    // Initialize contracts
    escrow_client.initialize(&manager_address, &token_address);
    manager_client.initialize(&admin, &escrow_address, &token_address);

    // Test Admin & Escrow address getters
    assert_eq!(manager_client.get_admin(), admin);
    assert_eq!(manager_client.get_escrow(), escrow_address);
    assert_eq!(manager_client.get_token(), token_address);

    // --- TEST 1: Event Creation ---
    let event_name = String::from_str(&env, "Stellar Orange Belt Concert");
    let ticket_price = 100i128;
    let max_tickets = 5u32;
    let event_date = 1717171717u64;

    let event_id = manager_client.create_event(
        &organizer,
        &event_name,
        &ticket_price,
        &max_tickets,
        &event_date,
    );

    assert_eq!(event_id, 1);

    // Fetch and check event info
    let event_info = manager_client.get_event(&event_id);
    assert_eq!(event_info.id, 1);
    assert_eq!(event_info.organizer, organizer);
    assert_eq!(event_info.ticket_price, ticket_price);
    assert_eq!(event_info.max_tickets, max_tickets);
    assert_eq!(event_info.sold_tickets, 0);
    assert_eq!(event_info.status, 0); // Open

    // Verify Escrow Info was created
    let escrow_info = escrow_client.get_escrow_info(&event_id);
    assert_eq!(escrow_info.recipient, organizer);
    assert_eq!(escrow_info.balance, 0);
    assert_eq!(escrow_info.status, 0); // Active

    // --- TEST 2: Ticket Purchase ---
    let purchase_quantity = 2u32;
    manager_client.purchase_ticket(&buyer, &event_id, &purchase_quantity);

    // Verify token balance transfers
    let expected_escrow_balance = ticket_price * (purchase_quantity as i128);
    assert_eq!(token_client.balance(&buyer), initial_balance - expected_escrow_balance);
    assert_eq!(token_client.balance(&escrow_address), expected_escrow_balance);

    // Verify buyer deposits in escrow
    assert_eq!(escrow_client.get_buyer_deposit(&event_id, &buyer), expected_escrow_balance);
    assert_eq!(escrow_client.get_escrow_info(&event_id).balance, expected_escrow_balance);

    // Check updated event stats
    let event_info = manager_client.get_event(&event_id);
    assert_eq!(event_info.sold_tickets, purchase_quantity);

    // Check minted tickets details & ownership
    let buyer_tickets = manager_client.get_user_tickets(&buyer);
    assert_eq!(buyer_tickets.len(), 2);
    
    let ticket_id_1 = buyer_tickets.get(0).unwrap();
    let ticket_id_2 = buyer_tickets.get(1).unwrap();

    let ticket_1 = manager_client.get_ticket(&ticket_id_1);
    assert_eq!(ticket_1.id, ticket_id_1);
    assert_eq!(ticket_1.event_id, event_id);
    assert_eq!(ticket_1.owner, buyer);
    assert_eq!(ticket_1.verified, false);

    // --- TEST 3: Ticket Transfer ---
    manager_client.transfer_ticket(&ticket_id_1, &buyer, &receiver);

    // Verify receiver ownership list
    let receiver_tickets = manager_client.get_user_tickets(&receiver);
    assert_eq!(receiver_tickets.len(), 1);
    assert_eq!(receiver_tickets.get(0).unwrap(), ticket_id_1);

    // Verify buyer ownership list decreased
    let buyer_tickets_after = manager_client.get_user_tickets(&buyer);
    assert_eq!(buyer_tickets_after.len(), 1);
    assert_eq!(buyer_tickets_after.get(0).unwrap(), ticket_id_2);

    let ticket_1_after = manager_client.get_ticket(&ticket_id_1);
    assert_eq!(ticket_1_after.owner, receiver);

    // --- TEST 4: Ticket Verification (Gate Scan) ---
    // Add verifier for the event
    manager_client.add_verifier(&event_id, &organizer, &verifier);

    // Verify ticket using the authorized verifier
    manager_client.verify_ticket(&ticket_id_2, &verifier);

    let ticket_2_after = manager_client.get_ticket(&ticket_id_2);
    assert_eq!(ticket_2_after.verified, true);

    // --- TEST 5: Complete Event & Release Payout ---
    let org_initial_balance = token_client.balance(&organizer);
    manager_client.complete_event(&event_id, &organizer);

    // Verify event status is Completed (2)
    assert_eq!(manager_client.get_event(&event_id).status, 2);

    // Verify escrow balance is 0 and organizer received the funds
    assert_eq!(token_client.balance(&escrow_address), 0);
    assert_eq!(token_client.balance(&organizer), org_initial_balance + expected_escrow_balance);
}

#[test]
#[should_panic(expected = "Event is not cancelled")]
fn test_cannot_refund_active_event() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    token_admin_client.mint(&buyer, &1000);

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = ticket_escrow::TicketEscrowClient::new(&env, &escrow_address);

    let manager_address = env.register_contract(None, TicketManager);
    let manager_client = TicketManagerClient::new(&env, &manager_address);

    escrow_client.initialize(&manager_address, &token_address);
    manager_client.initialize(&admin, &escrow_address, &token_address);

    let event_id = manager_client.create_event(
        &organizer,
        &String::from_str(&env, "Event"),
        &100,
        &10,
        &0,
    );

    manager_client.purchase_ticket(&buyer, &event_id, &1);
    let tickets = manager_client.get_user_tickets(&buyer);
    let ticket_id = tickets.get(0).unwrap();

    // Trying to claim refund when event is not cancelled (should panic)
    manager_client.claim_refund(&event_id, &ticket_id, &buyer);
}

#[test]
fn test_cancel_event_and_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_sac = env.register_stellar_asset_contract_v2(token_admin);
    let token_address = token_sac.address();
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    token_admin_client.mint(&buyer, &1000);

    let escrow_address = env.register_contract(None, TicketEscrow);
    let escrow_client = ticket_escrow::TicketEscrowClient::new(&env, &escrow_address);

    let manager_address = env.register_contract(None, TicketManager);
    let manager_client = TicketManagerClient::new(&env, &manager_address);

    escrow_client.initialize(&manager_address, &token_address);
    manager_client.initialize(&admin, &escrow_address, &token_address);

    let event_id = manager_client.create_event(
        &organizer,
        &String::from_str(&env, "Cancelled Event"),
        &100,
        &10,
        &0,
    );

    manager_client.purchase_ticket(&buyer, &event_id, &2);
    let tickets = manager_client.get_user_tickets(&buyer);
    
    let ticket_id_1 = tickets.get(0).unwrap();

    assert_eq!(token_client.balance(&buyer), 800);
    assert_eq!(token_client.balance(&escrow_address), 200);

    // Cancel event
    manager_client.cancel_event(&event_id, &organizer);
    assert_eq!(manager_client.get_event(&event_id).status, 1); // Cancelled

    // Claim refund for first ticket
    manager_client.claim_refund(&event_id, &ticket_id_1, &buyer);

    // Verify refund of 100 tokens (since 1 of 2 tickets was refunded)
    assert_eq!(token_client.balance(&buyer), 900);
    assert_eq!(token_client.balance(&escrow_address), 100);
}
