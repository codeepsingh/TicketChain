#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,           // Address of Ticket Manager
    Token,           // Address of Token (e.g. USDC/SAC)
    EventEscrow(u64), // Escrow details for a specific event ID
    BuyerDeposit(u64, Address), // Amount deposited by a buyer for a specific event
}

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct EscrowInfo {
    pub recipient: Address,
    pub balance: i128,
    pub status: u32, // 0 = Active, 1 = Completed (Paid Out), 2 = Cancelled (Refundable)
}

#[contract]
pub struct TicketEscrow;

#[contractimpl]
impl TicketEscrow {
    /// Initialize the escrow contract with the manager address and token address
    pub fn initialize(env: Env, manager: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &manager);
        env.storage().instance().set(&DataKey::Token, &token);
    }

    /// Retrieve the manager address
    pub fn get_manager(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Retrieve the token address
    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    /// Setup escrow for a new event
    pub fn setup_escrow(env: Env, event_id: u64, recipient: Address) {
        let manager = Self::get_manager(env.clone());
        manager.require_auth();

        let key = DataKey::EventEscrow(event_id);
        if env.storage().persistent().has(&key) {
            panic!("Escrow already exists for this event");
        }

        let info = EscrowInfo {
            recipient,
            balance: 0,
            status: 0,
        };
        env.storage().persistent().set(&key, &info);
    }

    /// Record a deposit from a buyer (called by manager after token transfer)
    pub fn record_deposit(env: Env, event_id: u64, buyer: Address, amount: i128) {
        let manager = Self::get_manager(env.clone());
        manager.require_auth();

        let escrow_key = DataKey::EventEscrow(event_id);
        let mut info: EscrowInfo = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .expect("Event escrow not found");

        if info.status != 0 {
            panic!("Event escrow is not active");
        }

        // Update buyer deposit registry
        let deposit_key = DataKey::BuyerDeposit(event_id, buyer.clone());
        let current_deposit: i128 = env
            .storage()
            .persistent()
            .get(&deposit_key)
            .unwrap_or(0);

        env.storage().persistent().set(&deposit_key, &(current_deposit + amount));

        // Update overall escrow balance
        info.balance += amount;
        env.storage().persistent().set(&escrow_key, &info);
    }

    /// Release payout to the organizer (called by manager)
    pub fn release_payout(env: Env, event_id: u64) {
        let manager = Self::get_manager(env.clone());
        manager.require_auth();

        let escrow_key = DataKey::EventEscrow(event_id);
        let mut info: EscrowInfo = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .expect("Event escrow not found");

        if info.status != 0 {
            panic!("Event escrow is not active");
        }

        let payout_amount = info.balance;
        if payout_amount <= 0 {
            panic!("No funds to pay out");
        }

        // Mark as completed
        info.balance = 0;
        info.status = 1;
        env.storage().persistent().set(&escrow_key, &info);

        // Transfer funds to recipient
        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &info.recipient, &payout_amount);

        // Emit payout event
        env.events().publish(
            (Symbol::new(&env, "escrow_payout"), event_id),
            (info.recipient, payout_amount),
        );
    }

    /// Cancel event and enable refunds (called by manager)
    pub fn enable_refunds(env: Env, event_id: u64) {
        let manager = Self::get_manager(env.clone());
        manager.require_auth();

        let escrow_key = DataKey::EventEscrow(event_id);
        let mut info: EscrowInfo = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .expect("Event escrow not found");

        if info.status != 0 {
            panic!("Event escrow is not active");
        }

        info.status = 2; // Cancelled/Refundable
        env.storage().persistent().set(&escrow_key, &info);

        // Emit cancel event
        env.events().publish(
            (Symbol::new(&env, "escrow_cancelled"), event_id),
            info.balance,
        );
    }

    /// Refund a specific buyer (called by manager)
    pub fn refund_buyer(env: Env, event_id: u64, buyer: Address, amount: i128) {
        let manager = Self::get_manager(env.clone());
        manager.require_auth();

        let escrow_key = DataKey::EventEscrow(event_id);
        let mut info: EscrowInfo = env
            .storage()
            .persistent()
            .get(&escrow_key)
            .expect("Event escrow not found");

        if info.status != 2 {
            panic!("Escrow is not in refundable state");
        }

        let deposit_key = DataKey::BuyerDeposit(event_id, buyer.clone());
        let deposit_amount: i128 = env
            .storage()
            .persistent()
            .get(&deposit_key)
            .expect("No deposit found for buyer");

        if deposit_amount < amount {
            panic!("Refund amount exceeds deposit");
        }

        // Deduct buyer deposit
        env.storage().persistent().set(&deposit_key, &(deposit_amount - amount));

        // Update overall balance
        info.balance -= amount;
        env.storage().persistent().set(&escrow_key, &info);

        // Transfer funds back to buyer
        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &buyer, &amount);

        // Emit refund event
        env.events().publish(
            (Symbol::new(&env, "escrow_refund"), event_id),
            (buyer, amount),
        );
    }

    /// Read escrow info for external components
    pub fn get_escrow_info(env: Env, event_id: u64) -> EscrowInfo {
        let escrow_key = DataKey::EventEscrow(event_id);
        env.storage()
            .persistent()
            .get(&escrow_key)
            .expect("Event escrow not found")
    }

    /// Read buyer deposit for external components
    pub fn get_buyer_deposit(env: Env, event_id: u64, buyer: Address) -> i128 {
        let deposit_key = DataKey::BuyerDeposit(event_id, buyer);
        env.storage().persistent().get(&deposit_key).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;

