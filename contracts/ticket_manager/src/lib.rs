#![no_std]
use soroban_sdk::{contract, contractimpl, contractclient, token, Address, Env, Symbol, Vec, String};

mod types;
use types::{DataKey, EventInfo, TicketInfo};

// Inter-contract interface for TicketEscrow
#[contractclient(name = "EscrowClient")]
pub trait EscrowInterface {
    fn setup_escrow(env: Env, event_id: u64, recipient: Address);
    fn record_deposit(env: Env, event_id: u64, buyer: Address, amount: i128);
    fn release_payout(env: Env, event_id: u64);
    fn enable_refunds(env: Env, event_id: u64);
    fn refund_buyer(env: Env, event_id: u64, buyer: Address, amount: i128);
}

#[contract]
pub struct TicketManager;

#[contractimpl]
impl TicketManager {
    /// Initialize the ticketing manager
    pub fn initialize(env: Env, admin: Address, escrow: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::EscrowContract, &escrow);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::EventCounter, &0u64);
        env.storage().instance().set(&DataKey::TicketCounter, &0u64);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_escrow(env: Env) -> Address {
        env.storage().instance().get(&DataKey::EscrowContract).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    /// Create a new event
    pub fn create_event(
        env: Env,
        organizer: Address,
        name: String,
        ticket_price: i128,
        max_tickets: u32,
        date: u64,
    ) -> u64 {
        organizer.require_auth();

        if ticket_price < 0 {
            panic!("Price cannot be negative");
        }
        if max_tickets == 0 {
            panic!("Max tickets must be greater than zero");
        }

        // Get new Event ID
        let mut counter: u64 = env.storage().instance().get(&DataKey::EventCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::EventCounter, &counter);

        let event_info = EventInfo {
            id: counter,
            organizer: organizer.clone(),
            ticket_price,
            max_tickets,
            sold_tickets: 0,
            status: 0, // Open
            name,
            date,
        };

        env.storage().persistent().set(&DataKey::Event(counter), &event_info);

        // Call escrow contract to set up escrow
        let escrow_addr = Self::get_escrow(env.clone());
        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        escrow_client.setup_escrow(&counter, &organizer);

        // Emit Event
        env.events().publish(
            (Symbol::new(&env, "event_created"), counter),
            (organizer, ticket_price, max_tickets),
        );

        counter
    }

    /// Purchase tickets
    pub fn purchase_ticket(env: Env, buyer: Address, event_id: u64, quantity: u32) {
        buyer.require_auth();

        if quantity == 0 {
            panic!("Quantity must be greater than 0");
        }

        let event_key = DataKey::Event(event_id);
        let mut event: EventInfo = env
            .storage()
            .persistent()
            .get(&event_key)
            .expect("Event not found");

        if event.status != 0 {
            panic!("Event is not open for ticket sales");
        }

        if event.sold_tickets + quantity > event.max_tickets {
            panic!("Not enough tickets available");
        }

        let total_price = event.ticket_price * (quantity as i128);

        // Transfer funds from Buyer to Escrow Address
        let token_addr = Self::get_token(env.clone());
        let escrow_addr = Self::get_escrow(env.clone());
        let token_client = token::Client::new(&env, &token_addr);

        token_client.transfer(&buyer, &escrow_addr, &total_price);

        // Call Escrow Contract to record deposit
        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        escrow_client.record_deposit(&event_id, &buyer, &total_price);

        // Mint Tickets
        let mut ticket_counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TicketCounter)
            .unwrap_or(0);

        let user_key = DataKey::UserTickets(buyer.clone());
        let mut user_tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or_else(|| Vec::new(&env));

        for _ in 0..quantity {
            ticket_counter += 1;

            let ticket = TicketInfo {
                id: ticket_counter,
                event_id,
                owner: buyer.clone(),
                original_buyer: buyer.clone(),
                verified: false,
            };

            env.storage().persistent().set(&DataKey::Ticket(ticket_counter), &ticket);
            user_tickets.push_back(ticket_counter);

            // Emit ticket purchase event
            env.events().publish(
                (Symbol::new(&env, "ticket_purchased"), event_id),
                (ticket_counter, buyer.clone()),
            );
        }

        env.storage().instance().set(&DataKey::TicketCounter, &ticket_counter);
        env.storage().persistent().set(&user_key, &user_tickets);

        // Update sold tickets count
        event.sold_tickets += quantity;
        env.storage().persistent().set(&event_key, &event);
    }

    /// Transfer a ticket to another address
    pub fn transfer_ticket(env: Env, ticket_id: u64, from: Address, to: Address) {
        from.require_auth();

        let ticket_key = DataKey::Ticket(ticket_id);
        let mut ticket: TicketInfo = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .expect("Ticket not found");

        if ticket.owner != from {
            panic!("Not the ticket owner");
        }

        if ticket.verified {
            panic!("Verified tickets cannot be transferred");
        }

        let event: EventInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Event(ticket.event_id))
            .expect("Event not found");

        if event.status != 0 {
            panic!("Event is completed or cancelled");
        }

        // Update Owner
        ticket.owner = to.clone();
        env.storage().persistent().set(&ticket_key, &ticket);

        // Remove ticket ID from sender list
        let from_key = DataKey::UserTickets(from.clone());
        let mut from_tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&from_key)
            .expect("Sender tickets registry not found");

        let from_idx = from_tickets.first_index_of(ticket_id).unwrap();
        from_tickets.remove(from_idx);
        env.storage().persistent().set(&from_key, &from_tickets);

        // Add ticket ID to receiver list
        let to_key = DataKey::UserTickets(to.clone());
        let mut to_tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&to_key)
            .unwrap_or_else(|| Vec::new(&env));
        to_tickets.push_back(ticket_id);
        env.storage().persistent().set(&to_key, &to_tickets);

        // Emit transfer event
        env.events().publish(
            (Symbol::new(&env, "ticket_transferred"), ticket_id),
            (from, to),
        );
    }

    /// Add a verifier for an event (only event organizer)
    pub fn add_verifier(env: Env, event_id: u64, organizer: Address, verifier: Address) {
        organizer.require_auth();

        let event: EventInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .expect("Event not found");

        if event.organizer != organizer {
            panic!("Not the event organizer");
        }

        env.storage()
            .persistent()
            .set(&DataKey::EventVerifier(event_id, verifier.clone()), &true);

        env.events().publish(
            (Symbol::new(&env, "verifier_added"), event_id),
            verifier,
        );
    }

    /// Verify ticket at the gate (only organizer or event verifier)
    pub fn verify_ticket(env: Env, ticket_id: u64, verifier: Address) {
        verifier.require_auth();

        let ticket_key = DataKey::Ticket(ticket_id);
        let mut ticket: TicketInfo = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .expect("Ticket not found");

        if ticket.verified {
            panic!("Ticket already verified");
        }

        let event: EventInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Event(ticket.event_id))
            .expect("Event not found");

        let is_authorized = verifier == event.organizer
            || env
                .storage()
                .persistent()
                .get(&DataKey::EventVerifier(ticket.event_id, verifier.clone()))
                .unwrap_or(false);

        if !is_authorized {
            panic!("Verifier not authorized for this event");
        }

        ticket.verified = true;
        env.storage().persistent().set(&ticket_key, &ticket);

        env.events().publish(
            (Symbol::new(&env, "ticket_verified"), ticket_id),
            verifier,
        );
    }

    /// Cancel event (refund eligible)
    pub fn cancel_event(env: Env, event_id: u64, organizer: Address) {
        organizer.require_auth();

        let event_key = DataKey::Event(event_id);
        let mut event: EventInfo = env
            .storage()
            .persistent()
            .get(&event_key)
            .expect("Event not found");

        if event.organizer != organizer {
            panic!("Not the event organizer");
        }

        if event.status != 0 {
            panic!("Event is not open or already finalized");
        }

        event.status = 1; // Cancelled
        env.storage().persistent().set(&event_key, &event);

        // Call escrow to enable refunds
        let escrow_addr = Self::get_escrow(env.clone());
        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        escrow_client.enable_refunds(&event_id);

        env.events().publish(
            (Symbol::new(&env, "event_cancelled"), event_id),
            organizer,
        );
    }

    /// Claim refund for a ticket (if event cancelled)
    pub fn claim_refund(env: Env, event_id: u64, ticket_id: u64, buyer: Address) {
        buyer.require_auth();

        let ticket_key = DataKey::Ticket(ticket_id);
        let ticket: TicketInfo = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .expect("Ticket not found");

        if ticket.owner != buyer {
            panic!("Not the ticket owner");
        }

        if ticket.event_id != event_id {
            panic!("Ticket does not belong to this event");
        }

        let event: EventInfo = env
            .storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .expect("Event not found");

        if event.status != 1 {
            panic!("Event is not cancelled");
        }

        // Burn/remove the ticket
        env.storage().persistent().remove(&ticket_key);

        // Remove from user tickets registry
        let user_key = DataKey::UserTickets(buyer.clone());
        let mut user_tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .expect("User tickets registry not found");

        let idx = user_tickets.first_index_of(ticket_id).unwrap();
        user_tickets.remove(idx);
        env.storage().persistent().set(&user_key, &user_tickets);

        // Call escrow to process refund
        let escrow_addr = Self::get_escrow(env.clone());
        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        escrow_client.refund_buyer(&event_id, &buyer, &event.ticket_price);

        env.events().publish(
            (Symbol::new(&env, "ticket_refunded"), event_id),
            (ticket_id, buyer),
        );
    }

    /// Complete event and trigger payout to organizer
    pub fn complete_event(env: Env, event_id: u64, organizer: Address) {
        organizer.require_auth();

        let event_key = DataKey::Event(event_id);
        let mut event: EventInfo = env
            .storage()
            .persistent()
            .get(&event_key)
            .expect("Event not found");

        if event.organizer != organizer {
            panic!("Not the event organizer");
        }

        if event.status != 0 {
            panic!("Event is not open");
        }

        event.status = 2; // Completed
        env.storage().persistent().set(&event_key, &event);

        // Call escrow to pay out
        let escrow_addr = Self::get_escrow(env.clone());
        let escrow_client = EscrowClient::new(&env, &escrow_addr);
        escrow_client.release_payout(&event_id);

        env.events().publish(
            (Symbol::new(&env, "event_completed"), event_id),
            organizer,
        );
    }

    /// Get details of an event
    pub fn get_event(env: Env, event_id: u64) -> EventInfo {
        env.storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .expect("Event not found")
    }

    /// Get details of a ticket
    pub fn get_ticket(env: Env, ticket_id: u64) -> TicketInfo {
        env.storage()
            .persistent()
            .get(&DataKey::Ticket(ticket_id))
            .expect("Ticket not found")
    }

    /// Get list of ticket IDs owned by a user
    pub fn get_user_tickets(env: Env, user: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::UserTickets(user))
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Upgrade manager contract wasm code (only admin)
    pub fn upgrade(env: Env, new_wasm_hash: soroban_sdk::BytesN<32>) {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}

#[cfg(test)]
mod test;
