# TicketChain Architecture & System Design

TicketChain is a decentralized ticket management platform built on Stellar using Soroban smart contracts. It guarantees secure, fraud-proof, and transferable event tickets.

## 1. System Architecture

The following diagram illustrates the user interactions, Stellar network integrations, and the relationship between the smart contracts.

```mermaid
graph TD
    Client[Web Client: Next.js + StellarWalletsKit] -->|Interact / Submit Tx| StellarRPC[Stellar Testnet RPC]
    Client -->|Subscribe / Stream| Horizon[Horizon / Event Stream]
    
    subgraph Soroban Smart Contracts
        TM[Ticket Manager Contract] <--->|C2C: Escrow Funds / Refund| TE[Ticket Escrow Contract]
    end
    
    StellarRPC -->|Execute Smart Contract| TM
    TM -->|Emit Event| EventLog[(Stellar Ledger Events)]
    Horizon -.->|Fetch Events| EventLog
```

---

## 2. Inter-Contract Communication Flow (C2C)

The `Ticket Manager` contract calls the `Ticket Escrow` contract to secure funds during purchases, release funds to organizers post-event, or perform refunds in case of event cancellations.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    actor Organizer
    participant TM as Ticket Manager Contract
    participant TE as Ticket Escrow Contract
    
    %% Event Creation & Deposit Setup
    Organizer->>TM: create_event(event_id, ticket_price, max_tickets, escrow_recipient)
    TM->>TE: setup_escrow(event_id, escrow_recipient)
    
    %% Ticket Purchase
    Buyer->>TM: purchase_ticket(event_id, buyer_address, quantity)
    TM->>TM: Verify ticket availability & price
    TM->>TE: deposit_funds(event_id, buyer_address, total_price)
    TE-->>TM: Confirm payment transfer
    TM->>TM: Mint & transfer tickets (on-chain state update)
    
    %% Event Settlement / Payout
    Organizer->>TM: complete_event(event_id)
    TM->>TE: release_payout(event_id)
    TE->>Organizer: Transfer accumulated funds
    
    %% Event Cancellation / Refund
    Note over Organizer, TM: If Event is Cancelled
    Organizer->>TM: cancel_event(event_id)
    TM->>TE: enable_refunds(event_id)
    Buyer->>TM: claim_refund(event_id, ticket_id)
    TM->>TE: execute_refund(event_id, Buyer)
    TE->>Buyer: Return funds
```

---

## 3. Directory Layout

The workspace is organized into contracts, frontend application, CI/CD configurations, and deployment scripts:

```
TicketChain/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # PR validation, linting, testing & deployment
├── contracts/
│   ├── ticket_manager/           # Core ticketing state & rules
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   └── types.rs
│   │   └── Cargo.toml
│   ├── ticket_escrow/            # Financial escrow & payout handling
│   │   ├── src/
│   │   │   └── lib.rs
│   │   └── Cargo.toml
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (Landing, Dashboard, etc.)
│   │   ├── components/           # Shared UI elements & Transaction Center
│   │   ├── hooks/                # Wallet & contract hooks
│   │   ├── lib/                  # Services & configuration (wallet-kit, RPC)
│   │   └── store/                # Zustand global states (Activity, Tx Center)
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── scripts/
│   ├── deploy.sh                 # Local & Testnet build/deploy script
│   └── upgrade.sh                # Contract upgrade/migration script
├── architecture.md               # Architecture description
├── .env.example                  # Environment configuration template
└── README.md                     # Production user guide
```

---

## 4. Advanced Soroban Storage & Security Design

- **Custom Storage Pattern**: We implement Temporary, Instance, and Persistent storage types appropriately to manage ledger fees and state expiration:
  - **Instance Storage**: Used for configuration, metadata, and event details (since these require frequent updates and are tied to the contract's lifecycles).
  - **Persistent Storage**: Used for user ticket ownership lookup data (to prevent state from expiring prematurely).
  - **Temporary Storage**: Used for caching temporary validation states (such as signatures, double-spend prevention tokens).
- **Access Control (RBAC)**: Custom administrative ownership is stored in Instance storage. Organizers can define assistants or validation accounts (RBAC) to scan tickets at the gate.
- **Contract Upgradeability**: We include a standard upgrade pattern (`env.deployer().update_current_contract_wasm`) restricted to the contract owner/administrator.
- **Reentrancy Protection**: Financial payouts in `Ticket Escrow` employ a checks-effects-interactions pattern and only accept incoming calls from the registered `Ticket Manager` contract.
