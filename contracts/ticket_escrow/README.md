# TicketEscrow Smart Contract

The `TicketEscrow` contract manages financial transactions for the **TicketChain** platform. It holds payment tokens (e.g. USDC/SAC) deposited during ticket purchases, manages event-specific balances, releases payouts to event organizers upon successful completion, and processes refunds to buyers if an event is cancelled.

## Purpose

- **Financial Isolation**: Isolates event ticket revenue from the main management contract.
- **Deposit Tracking**: Maintains a record of how much each buyer has deposited for an event to prevent double-refunds or incorrect refund amounts.
- **Payout Release**: Automates transfer of accumulated event revenue to the event organizer upon event completion.
- **Refund Processing**: Allows buyers to retrieve their exact deposited amounts if the event organizer cancels the event.

## Storage Design

The contract uses persistent storage for dynamic data and instance storage for contract configurations:

| Storage Key | Type | Description | Storage Class |
|---|---|---|---|
| `Admin` | `Address` | The address of the TicketManager contract authorized to make state updates. | Instance |
| `Token` | `Address` | The token address (e.g., SAC USDC) managed by the escrow. | Instance |
| `EventEscrow(u64)` | `EscrowInfo` | Holds recipient address, current balance, and status (0 = Active, 1 = Completed, 2 = Cancelled/Refundable). | Persistent |
| `BuyerDeposit(u64, Address)` | `i128` | The exact amount of tokens deposited by a specific buyer for an event. | Persistent |

## Functions

### Initialization
```rust
pub fn initialize(env: Env, manager: Address, token: Address)
```
Configures the escrow with the authorized `TicketManager` contract address and payment token address. Can only be run once.

### Getters
- `get_manager(env: Env) -> Address`
- `get_token(env: Env) -> Address`
- `get_escrow_info(env: Env, event_id: u64) -> EscrowInfo`
- `get_buyer_deposit(env: Env, event_id: u64, buyer: Address) -> i128`

### Restricted Admin Operations (Only TicketManager)

The following functions require signature validation from the authorized `TicketManager` admin:

```rust
pub fn setup_escrow(env: Env, event_id: u64, recipient: Address)
```
Configures a new event escrow registry with a recipient (organizer) address and zero balance.

```rust
pub fn record_deposit(env: Env, event_id: u64, buyer: Address, amount: i128)
```
Records a deposit made by a ticket buyer. Adds the amount to the buyer's deposit balance and the event's total escrow balance.

```rust
pub fn release_payout(env: Env, event_id: u64)
```
Transfers all accumulated event funds to the organizer and marks the escrow state as completed.

```rust
pub fn enable_refunds(env: Env, event_id: u64)
```
Marks the escrow state as refundable. Only allowed if the escrow is currently active.

```rust
pub fn refund_buyer(env: Env, event_id: u64, buyer: Address, amount: i128)
```
Transfers the specified amount back to the buyer, decrementing their buyer deposit record and the event's total escrow balance. Only callable in the refundable state.

## Events

The contract publishes events for financial movements:
- `escrow_payout`: Topic: `("escrow_payout", event_id)`. Data: `(recipient, payout_amount)`
- `escrow_cancelled`: Topic: `("escrow_cancelled", event_id)`. Data: `balance`
- `escrow_refund`: Topic: `("escrow_refund", event_id)`. Data: `(buyer, amount)`

## Tests

Unit tests are implemented in `src/test.rs`. Run tests with:
```bash
cargo test
```
The test suite covers:
1. Escrow initialization and configuration verification
2. Escrow setup and deposit recording
3. Event payouts to organizers
4. Transitioning to Refundable state and refunding buyers

## Deployment

To build the Wasm binary:
```bash
cargo build --target wasm32-unknown-unknown --release
```
To deploy the contract on Testnet:
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/ticket_escrow.wasm \
  --source admin_key \
  --network testnet
```
