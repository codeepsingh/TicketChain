# TicketManager Smart Contract

The `TicketManager` smart contract serves as the primary entry point and orchestrator for the **TicketChain** platform. It handles event registration, ticket purchases, ownership tracking, gate verifier management, ticket verification, and event finalization. It integrates with the `TicketEscrow` contract to hold funds securely until event completion or cancellation.

## Purpose

- **Event Lifecycle Management**: Organizers can create events, cancel events, or complete events.
- **Ticket Purchase & Minting**: Buyers purchase tickets in USDC (or other Stellar assets), which triggers inter-contract calls to the `TicketEscrow` contract and mints non-transferable verified tickets or transferable unverified tickets.
- **Access Control & Verification**: Organizers can authorize gate verifiers. Verifiers scan and mark tickets as checked-in (verified).
- **Secondary Transfers**: Users can transfer unverified tickets to other Stellar accounts.
- **Refunds**: If an event is cancelled, users can burn their tickets and receive their deposits back.

## Storage Design

The contract uses persistent storage for dynamic data and instance storage for contract-wide configurations. Keys are defined in `src/types.rs`:

| Storage Key | Type | Description | Storage Class |
|---|---|---|---|
| `Admin` | `Address` | The administrator of the TicketManager. | Instance |
| `EscrowContract` | `Address` | The address of the deployed TicketEscrow contract. | Instance |
| `Token` | `Address` | The token address (e.g. SAC USDC). | Instance |
| `EventCounter` | `u64` | Incremental counter for generating Event IDs. | Instance |
| `TicketCounter` | `u64` | Incremental counter for generating Ticket IDs. | Instance |
| `Event(u64)` | `EventInfo` | Metadata for a specific event ID. | Persistent |
| `Ticket(u64)` | `TicketInfo` | Ownership and status of a specific ticket ID. | Persistent |
| `UserTickets(Address)` | `Vec<u64>` | A list of ticket IDs owned by a user address. | Persistent |
| `EventVerifier(u64, Address)` | `bool` | Flag identifying if an address is authorized to verify tickets for an event. | Persistent |

## Functions

### Initialization
```rust
pub fn initialize(env: Env, admin: Address, escrow: Address, token: Address)
```
Initializes the contract state with the admin address, escrow contract address, and the payment token address. Can only be called once.

### Getters
- `get_admin(env: Env) -> Address`
- `get_escrow(env: Env) -> Address`
- `get_token(env: Env) -> Address`
- `get_event(env: Env, event_id: u64) -> EventInfo`
- `get_ticket(env: Env, ticket_id: u64) -> TicketInfo`
- `get_user_tickets(env: Env, user: Address) -> Vec<u64>`

### Core Operations

```rust
pub fn create_event(
    env: Env,
    organizer: Address,
    name: String,
    ticket_price: i128,
    max_tickets: u32,
    date: u64,
) -> u64
```
Registers a new event and invokes the escrow contract to setup the corresponding event wallet. Returns the new Event ID.

```rust
pub fn purchase_ticket(env: Env, buyer: Address, event_id: u64, quantity: u32)
```
Transfers payment tokens from the buyer to the escrow contract, updates event statistics, and mints ticket NFTs.

```rust
pub fn transfer_ticket(env: Env, ticket_id: u64, from: Address, to: Address)
```
Transfers ownership of an unverified ticket. Verified tickets cannot be transferred.

```rust
pub fn add_verifier(env: Env, event_id: u64, organizer: Address, verifier: Address)
```
Authorizes a verifier for an event. Must be signed by the event organizer.

```rust
pub fn verify_ticket(env: Env, ticket_id: u64, verifier: Address)
```
Marks a ticket as verified (scanned at the gate). Must be signed by an authorized verifier or the organizer.

```rust
pub fn cancel_event(env: Env, event_id: u64, organizer: Address)
```
Cancels an event and instructs the escrow contract to enable refunds.

```rust
pub fn claim_refund(env: Env, event_id: u64, ticket_id: u64, buyer: Address)
```
Burns a ticket and triggers a refund payout from the escrow contract to the buyer. Only callable if the event is cancelled.

```rust
pub fn complete_event(env: Env, event_id: u64, organizer: Address)
```
Completes an event and triggers the release of all ticket purchase funds from the escrow contract to the organizer.

```rust
pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>)
```
Upgrades the contract wasm code. Requires admin signature.

## Events

The contract publishes events for key state mutations:
- `event_created`: Topic: `("event_created", event_id)`. Data: `(organizer, ticket_price, max_tickets)`
- `ticket_purchased`: Topic: `("ticket_purchased", event_id)`. Data: `(ticket_id, buyer)`
- `ticket_transferred`: Topic: `("ticket_transferred", ticket_id)`. Data: `(from, to)`
- `verifier_added`: Topic: `("verifier_added", event_id)`. Data: `verifier`
- `ticket_verified`: Topic: `("ticket_verified", ticket_id)`. Data: `verifier`
- `event_cancelled`: Topic: `("event_cancelled", event_id)`. Data: `organizer`
- `ticket_refunded`: Topic: `("ticket_refunded", event_id)`. Data: `(ticket_id, buyer)`
- `event_completed`: Topic: `("event_completed", event_id)`. Data: `organizer`

## Tests

Unit tests are implemented in `src/test.rs`. Run tests with:
```bash
cargo test
```
The test suite covers:
1. Event Creation & Metadata Setup
2. Ticket Purchase, Minting, and Inter-Contract Balance Transfer
3. Ticket Transfer and Owner List updates
4. Ticket Verification and Gate scanning permission check
5. Event Cancellation and Refund flows

## Deployment

To build the Wasm binary:
```bash
cargo build --target wasm32-unknown-unknown --release
```
To deploy the contract on Testnet:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/ticket_manager.wasm \
  --source admin_key \
  --network testnet
```
