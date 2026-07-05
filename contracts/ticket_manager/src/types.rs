use soroban_sdk::{contracttype, Address, String};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub enum DataKey {
    Admin,                    // Contract administrator
    EscrowContract,           // Escrow contract address
    Token,                    // Payment token (SAC)
    EventCounter,             // Global event ID counter (u64)
    TicketCounter,            // Global ticket ID counter (u64)
    Event(u64),               // Event metadata by ID
    Ticket(u64),              // Ticket metadata by ID
    UserTickets(Address),     // List of ticket IDs owned by a user
    EventVerifier(u64, Address), // Whether a user is authorized to verify tickets for an event
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct EventInfo {
    pub id: u64,
    pub organizer: Address,
    pub ticket_price: i128,
    pub max_tickets: u32,
    pub sold_tickets: u32,
    pub status: u32,          // 0 = Open, 1 = Cancelled, 2 = Completed
    pub name: String,
    pub date: u64,            // Timestamp of the event
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct TicketInfo {
    pub id: u64,
    pub event_id: u64,
    pub owner: Address,
    pub original_buyer: Address,
    pub verified: bool,       // If scanned at entry
}
