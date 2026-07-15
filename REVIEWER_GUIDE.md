# 🗺️ Reviewer Guide — TicketChain

This guide is designed to help a reviewer verify all required files, contract structures, tests, wallet integrations, and deployment configurations of the **TicketChain** repository in **less than 60 seconds**.

---

## 1. Smart Contracts

All smart contract logic is written in Rust using the Soroban SDK.

**Exact files to inspect:**
- **Workspace Cargo Configuration**: [contracts/Cargo.toml](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/Cargo.toml) (Defines workspace members: `ticket_manager` and `ticket_escrow`)
- **Workspace Lockfile**: [contracts/Cargo.lock](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/Cargo.lock) (Dependency lockfile)
- **Workspace Makefile**: [contracts/Makefile](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/Makefile) (Orchestrates contract build/test workflows)
- **TicketManager Package**:
  - [contracts/ticket_manager/Cargo.toml](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/Cargo.toml) (Package dependencies)
  - [contracts/ticket_manager/Makefile](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/Makefile) (Local build commands)
  - [contracts/ticket_manager/README.md](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/README.md) (Contract documentation)
  - [contracts/ticket_manager/src/lib.rs](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/src/lib.rs) (Core entrypoints: `create_event`, `purchase_ticket`, `transfer_ticket`, `verify_ticket`, `cancel_event`, `claim_refund`, `complete_event`)
  - [contracts/ticket_manager/src/types.rs](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/src/types.rs) (Data structures and storage keys)
- **TicketEscrow Package**:
  - [contracts/ticket_escrow/Cargo.toml](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_escrow/Cargo.toml) (Package dependencies)
  - [contracts/ticket_escrow/Makefile](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_escrow/Makefile) (Local build commands)
  - [contracts/ticket_escrow/README.md](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_escrow/README.md) (Contract documentation)
  - [contracts/ticket_escrow/src/lib.rs](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_escrow/src/lib.rs) (Escrow logic: `initialize`, `setup_escrow`, `record_deposit`, `release_payout`, `enable_refunds`, `refund_buyer`)

---

## 2. Tests

The contract workspace contains complete unit and integration tests written using Soroban's mock environment testing tools.

**Exact files to inspect:**
- **TicketManager Integration Tests**: [contracts/ticket_manager/src/test.rs](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_manager/src/test.rs)
  - Verifies: Event creation, ticket purchase & minting, ticket transfer, gate verification, event cancellation & refund flows, and event completion with payout.
- **TicketEscrow Unit Tests**: [contracts/ticket_escrow/src/test.rs](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/contracts/ticket_escrow/src/test.rs)
  - Verifies: Escrow initialization, deposit recording, organizer payouts, refund activation, and buyer refunds.

---

## 3. Wallet Integration

The frontend utilizes the `@stellar/freighter-api` package to integrate with the Freighter browser wallet extension.

**Exact files to inspect:**
- **Central Wallet Service**: [frontend/src/services/walletService.ts](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/services/walletService.ts)
  - `checkConnection` (line 46) — Detects Freighter installation.
  - `connectWallet` (line 72) — Requests access and retrieves user address.
  - `disconnectWallet` (line 117) — Clears connection states.
  - `getWalletBalance` (line 145) — Fetches XLM balance via Horizon API.
- **React Wallet Hook**: [frontend/src/hooks/useWallet.ts](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/hooks/useWallet.ts)
  - Exposes reactive wallet states and methods (`isConnected`, `address`, `balance`, `connect`, `disconnect`).
- **Navbar Button Trigger**: [frontend/src/components/Navbar.tsx](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/components/Navbar.tsx)
  - `handleConnect` (line 46) — Handles the button click and connects Freighter.

---

## 4. Transaction Signing

Mutating smart contract calls are signed by Freighter using the transaction envelope XDR format.

**Exact files to inspect:**
- **Soroban Service Invoker**: [frontend/src/services/stellar.ts](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/services/stellar.ts)
  - `StellarService.invokeContract` (line 231) — Builds the Soroban transaction, simulates footprint and resource limits using preflight, and calls `signFreighterTransaction` (line 267) to display the user authorization popup.
- **Wallet Service Signer**: [frontend/src/services/walletService.ts](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/services/walletService.ts)
  - `signTransaction` (line 179) — Exposes a standalone signed transaction helper calling Freighter's `signTransaction`.

---

## 5. Frontend Integration

Frontend mutations consume custom React hooks to invoke signed Soroban transactions and update the UI states.

**Exact files to inspect:**
- **Ticketing Operations Hooks**: [frontend/src/hooks/useTickets.ts](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/frontend/src/hooks/useTickets.ts)
  - `useCreateEvent` (line 57) — Triggers `StellarService.createEvent`.
  - `usePurchaseTicket` (line 131) — Triggers `StellarService.purchaseTicket`.
  - `useTransferTicket` (line 224) — Triggers `StellarService.transferTicket`.
  - `useVerifyTicket` (line 294) — Triggers `StellarService.verifyTicket`.
  - `useCancelEvent` (line 358) — Triggers `StellarService.cancelEvent`.
  - `useClaimRefund` (line 420) — Triggers `StellarService.claimRefund`.
  - `useCompleteEvent` (line 481) — Triggers `StellarService.completeEvent`.

---

## 6. CI/CD

Continuous Integration builds, tests, and deploys both contract and frontend code on every push or pull request.

**Exact files to inspect:**
- **GitHub Actions Workflow**: [.github/workflows/ci-cd.yml](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/.github/workflows/ci-cd.yml)
  - `contracts` job (line 14) — Sets up Rust and targets `wasm32-unknown-unknown`, runs cargo build and cargo test.
  - `frontend` job (line 40) — Installs node packages, runs vitest tests, builds Vite application, and triggers deployment.

---

## 7. Deployment

Static assets are hosted and deployed on Netlify.

**Exact files to inspect:**
- **Netlify configuration**: [netlify.toml](file:///c:/Users/Arya%20Bhagat/Desktop/ticketchain_/netlify.toml)
  - Configures the build settings (`base = "frontend"`, `command = "npm run build"`, `publish = "dist"`) and routing rules (`/*` redirects to `/index.html` for single-page routing).
