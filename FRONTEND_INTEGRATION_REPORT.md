# 📱 Frontend Integration Report — TicketChain

This report provides a detailed breakdown of the frontend codebase of **TicketChain**, focusing on how wallet connection, state management, transaction signing, and Soroban smart contract calls are integrated.

---

## 1. File: `frontend/src/services/stellar.ts`

- **Purpose**: This service acts as the blockchain client layer for the TicketChain frontend. It encapsulates all low-level calls to the Stellar Horizon API (for account info and XLM balance) and the Soroban RPC server (for preflight simulation, XDR construction, and transaction submission).
- **Wallet Integration**: Integrates directly with `@stellar/freighter-api` to trigger the user's browser extension for transaction signing. It contains `connectStellarWallet()` which detects and requests Freighter authorization.
- **Contract Integration**: Directly imports `@stellar/stellar-sdk` types (`Contract`, `Address`, `xdr`, etc.) to target the deployed `TicketManager` contract. It constructs and encodes arguments (e.g. converting JS types to ScVals using `nativeToScVal` and decoding them via `scValToNative`).
- **Transaction Signing**: Implements `StellarService.invokeContract()`, which:
  1. Builds a transaction with `TransactionBuilder`.
  2. Runs preflight simulation via `rpcServer.simulateTransaction()`.
  3. Re-assembles transaction resources.
  4. Calls `signFreighterTransaction(txXdr)` to open the Freighter popup.
  5. Wraps and submits the signed transaction to the Soroban RPC.
- **Address Retrieval**: Does not fetch the address directly but receives it from callers as `signerAddress` to bind the transaction signature.

---

## 2. File: `frontend/src/services/walletService.ts`

- **Purpose**: Serves as the centralized service layer for Freighter wallet lifecycle management. It wraps the Freighter API and exports clean promises for UI components and custom hooks to consume.
- **Wallet Integration**: Acts as the main wrapper for `@stellar/freighter-api` library functions (`isConnected`, `requestAccess`, `signTransaction`).
- **Contract Integration**: Does not call the smart contracts directly, but provides the helper `signTransaction(txXdr, address)` which is used by `StellarService.invokeContract()` to sign contract call payloads.
- **Transaction Signing**: Exports `signTransaction()` which takes an unsigned XDR string and the signer's address, prompts the user via Freighter's chrome extension popup, and returns the signed XDR string.
- **Address Retrieval**: Implements `connectWallet()` which requests public address access via Freighter's API. It also exports `getWalletAddress()` to retrieve the currently connected address from the Zustand store.

---

## 3. File: `frontend/src/hooks/useWallet.ts`

- **Purpose**: A custom React hook that exposes reactive wallet state and actions to components, decoupling the UI components from the underlying service and store implementations.
- **Wallet Integration**: Exposes functions like `connect()`, `disconnect()`, and `refreshBalance()` that call `walletService.ts`.
- **Contract Integration**: Does not manage contracts directly, but provides the connected `address` and `balance` used by contract invocation modules.
- **Transaction Signing**: Does not sign transactions directly, but sets the state `isConnected` and `address` required by mutation functions to build the signing payloads.
- **Address Retrieval**: Subscribes to the global Zustand store to dynamically retrieve `walletAddress` (aliased as `address`), `walletConnected`, and `tokenBalance`.

---

## 4. File: `frontend/src/hooks/useTickets.ts`

- **Purpose**: Encapsulates all mutations and queries for the platform. It uses React Query (`@tanstack/react-query`) to coordinate local caching, optimistic updates, and Soroban contract transaction lifecycles.
- **Wallet Integration**: Safeguards mutations by checking `store.walletAddress` and throwing an error if the user's wallet is not connected.
- **Contract Integration**: Translates frontend user actions (like clicking "Buy Ticket") into `StellarService` calls that target the on-chain smart contracts.
- **Transaction Signing**: Leverages `StellarService` under-the-hood, which invokes Freighter transaction signing for mutating contract calls:
  - `useCreateEvent` calls `StellarService.createEvent()`
  - `usePurchaseTicket` calls `StellarService.purchaseTicket()`
  - `useTransferTicket` calls `StellarService.transferTicket()`
  - `useVerifyTicket` calls `StellarService.verifyTicket()`
  - `useCancelEvent` calls `StellarService.cancelEvent()`
  - `useCompleteEvent` calls `StellarService.completeEvent()`
  - `useClaimRefund` calls `StellarService.claimRefund()`
- **Address Retrieval**: Reads the current wallet address directly from the global Zustand store (`store.walletAddress`) to supply the required signer parameter for contract calls.

---

## 5. File: `frontend/src/components/Navbar.tsx`

- **Purpose**: Provides the primary navigation bar and wallet controller UI for the TicketChain application.
- **Wallet Integration**: Integrates the connection and disconnection UI. Shows the active connection status with a green pulse dot and displays the connected address.
- **Contract Integration**: Read-only integration. Displays the user's current token balance from the state, reflecting purchases or payouts that happened on-chain.
- **Transaction Signing**: Does not sign transactions directly, but initiates the authorization flow which is required before any transaction signing can take place.
- **Address Retrieval**: Subscribes to `walletAddress`, `walletConnected`, and `tokenBalance` from the Zustand store. Formats the retrieved public address to a shortened view (e.g. `GBAB...3B4D`).

---

## Technical Summary Matrix

| File Path | Wallet connection | Transaction Signing | Address Retrieval | Contract Interaction |
|---|---|---|---|---|
| `stellar.ts` | Yes (calls Freighter API) | Yes (initiates Freighter popup) | No (receives from callers) | Yes (direct Soroban SDK calls) |
| `walletService.ts` | Yes (central wrapper) | Yes (signs transaction XDR) | Yes (updates Zustand) | Indirect (signs XDR payloads) |
| `useWallet.ts` | Yes (react actions wrapper) | No (facilitates via hooks) | Yes (subscribes to Zustand) | No |
| `useTickets.ts` | No (guards transactions) | Yes (triggers via mutations) | Yes (gets from store) | Yes (routes to `stellar.ts`) |
| `Navbar.tsx` | Yes (Connect/Disconnect UI) | No | Yes (displays formatted key) | No |
