# 🗺️ Reviewer Guide — TicketChain Source Code Map

> **Purpose:** Help a reviewer find wallet integration within 30 seconds of opening this repository.

---

## ⚡ 30-Second Verification Path

```
1. Open:  frontend/src/services/walletService.ts
          → connectWallet()       ← requestAccess() call
          → signTransaction()     ← freighterSignTransaction() call
          → getWalletAddress()    ← address from Freighter
          → getWalletBalance()    ← Horizon API balance

2. Open:  frontend/src/services/stellar.ts
          → connectStellarWallet()     [line ~385]  ← Freighter connection
          → StellarService.invokeContract() [line ~230] ← signFreighterTransaction()

3. Open:  frontend/src/components/Navbar.tsx
          → handleConnect()            [line 46]    ← Connect Wallet button

4. Visit: /#/wallet-demo               ← Live interactive demo page
```

---

## 📂 Repository Structure

```
ticketchain_/
├── README.md                          ← Wallet integration section included
├── WALLET_INTEGRATION_REPORT.md       ← Full wallet audit document
├── REVIEWER_GUIDE.md                  ← This file
├── LEVEL1_RESUBMISSION_REPORT.md      ← Resubmission evidence package
│
├── contracts/
│   ├── ticket_manager/                ← Soroban smart contract (Rust)
│   └── ticket_escrow/                 ← Escrow contract (Rust)
│
└── frontend/
    └── src/
        ├── services/
        │   ├── walletService.ts       ← ★ PRIMARY WALLET SERVICE
        │   └── stellar.ts             ← Soroban + Freighter integration
        │
        ├── hooks/
        │   ├── useWallet.ts           ← ★ WALLET REACT HOOK
        │   └── useTickets.ts          ← On-chain mutations (use signTransaction)
        │
        ├── store/
        │   └── useTicketStore.ts      ← Zustand wallet state
        │
        ├── components/
        │   └── Navbar.tsx             ← ★ CONNECT WALLET BUTTON
        │
        └── pages/
            └── WalletDemoPage.tsx     ← ★ LIVE REVIEWER DEMO (route: /wallet-demo)
```

---

## 🔌 Wallet Connection

| What | Where | Function |
|---|---|---|
| Connection check | `walletService.ts` | `checkConnection()` → `isConnected()` |
| Permission request | `walletService.ts` | `connectWallet()` → `requestAccess()` |
| Legacy connection | `stellar.ts` | `connectStellarWallet()` → `requestFreighterAccess()` |
| Store wallet state | `useTicketStore.ts` | `connectWallet(address, walletName)` |
| UI Connect button | `Navbar.tsx` | `handleConnect()` → `connectStellarWallet()` |

---

## 🔑 Wallet Permissions

| What | Where | API |
|---|---|---|
| Request permission | `walletService.ts:95` | `freighterRequestAccess()` |
| Also in | `stellar.ts:403` | `requestFreighterAccess()` |
| Package | `package.json` | `@stellar/freighter-api: ^6.0.1` |

---

## 📫 Address Retrieval

| What | Where | Returns |
|---|---|---|
| From Freighter | `walletService.ts` | `const { address } = await requestAccess()` |
| From store | `walletService.ts` | `getWalletAddress()` → `store.walletAddress` |
| In store | `useTicketStore.ts` | `walletAddress: string \| null` |
| Used in hooks | `useTickets.ts` | `store.walletAddress` (guards all mutations) |

---

## ✍️ Transaction Signing

| What | Where | API |
|---|---|---|
| Sign wrapper | `walletService.ts:170` | `signTransaction(txXdr, address)` |
| In Soroban flow | `stellar.ts:228` | `signFreighterTransaction(txXdr, {...})` |
| Full flow | `stellar.ts:invokeContract()` | Build → Simulate → Assemble → **Sign** → Submit |
| Operations signed | `useTickets.ts` | createEvent, purchaseTicket, transferTicket, verifyTicket, cancelEvent, completeEvent, claimRefund |

---

## 💰 Balance Fetching

| What | Where | API |
|---|---|---|
| Service | `walletService.ts:145` | `getWalletBalance(address)` |
| Also in | `stellar.ts` | `StellarService.getAccountBalance(address)` |
| Auto-sync | `App.tsx:105` | 15-second interval via `setInterval` |

---

## 📦 Smart Contracts

| Contract | Address | Purpose |
|---|---|---|
| Ticket Manager | `CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O` | Event creation, ticket management |
| Ticket Escrow | `CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3` | Funds escrow, refunds, payouts |

---

## 🧪 CI/CD Pipeline

| Job | What | Status |
|---|---|---|
| `contracts` | `cargo build --target wasm32-unknown-unknown` | ✅ Configured |
| `contracts` | `cargo test` | ✅ Configured |
| `frontend` | `npm ci` + `npm run test` | ✅ Configured |
| `frontend` | `npm run build` | ✅ Configured |
| `deploy` | Netlify (gracefully skips if no secrets) | ✅ Configured |

**File:** `.github/workflows/ci-cd.yml`

---

## 🖥️ Live Demo

**Route:** `/#/wallet-demo`

**Direct URL:** `https://ticketchain1.netlify.app/#/wallet-demo`

This page demonstrates:
- ✅ Connect Wallet (live Freighter popup)
- ✅ Disconnect Wallet
- ✅ Address display
- ✅ Balance fetching
- ✅ Transaction signing (demo XDR)
- ✅ Connection status
- ✅ Code evidence blocks

---

*TicketChain — Stellar SCF Hackathon Submission*
