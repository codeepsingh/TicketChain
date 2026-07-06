# Sentry — Error Monitoring Setup Guide
**Project:** TicketChain  
**Date:** 2026-07-06  
**Status:** ✅ Code integrated — DSN configuration required

---

## What Was Implemented

| File | Change |
|---|---|
| `frontend/src/utils/sentry.ts` | Full Sentry wrapper with graceful fallback |
| `frontend/src/main.tsx` | `initSentry()` called before React renders |
| `frontend/src/hooks/useTickets.ts` | `captureContractError()` in all catch blocks |
| `frontend/src/services/stellar.ts` | `captureWalletError()` in wallet connection catch |
| `frontend/src/App.tsx` | `setSentryUser()` on wallet connect/disconnect |

---

## Errors Monitored

| Category | What's Captured | Context Tags |
|---|---|---|
| **Wallet Errors** | Freighter connection failures, access rejections | `area: wallet`, `wallet_prefix` |
| **Contract Errors** | Soroban invocation failures, simulation errors | `contract_method`, `contract_id`, `wallet_prefix` |
| **Simulation Errors** | Preflight failures before signing | `area: simulation`, `contract_method` |
| **Network Errors** | Horizon/RPC connectivity failures | `area: network`, `endpoint` |
| **Transaction Timeouts** | Status polling exhausted | `contract_method` |
| **Unhandled Exceptions** | Any uncaught React/runtime errors | Automatic via Sentry SDK |
| **User Rejections** | Filtered out (not real errors) | Ignored via `ignoreErrors` |

---

## Setup Instructions (One-Time)

### Step 1: Create Sentry Project

1. Go to https://sentry.io/ and create a free account
2. Click **Create Project** → Select **React**
3. Name it `ticketchain-production`
4. Copy the **DSN** (Data Source Name) — looks like:  
   `https://abc123@o123456.ingest.sentry.io/789012`

### Step 2: Install Sentry SDK

```bash
cd frontend
npm install @sentry/react
```

### Step 3: Set the DSN

In `frontend/.env`:

```env
VITE_SENTRY_DSN=https://YOUR_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX
```

In Netlify dashboard → Site settings → Environment variables → Add:
- Key: `VITE_SENTRY_DSN`
- Value: `https://YOUR_KEY@oXXXXXX.ingest.sentry.io/XXXXXXX`

### Step 4: Verify Integration

1. Deploy to Netlify with the DSN set
2. Open https://ticketchain1.netlify.app/
3. Go to Sentry → **Issues** dashboard
4. Trigger a test error: try connecting wallet without Freighter installed
5. Check Sentry receives the error with wallet context tags
6. Go to Sentry → **Performance** → check page load metrics

### Step 5: Screenshot for Level 4 Evidence

Take a screenshot of:
- Sentry **Issues** dashboard (ideally showing 0 unresolved errors = healthy)
- Sentry **Performance** overview
- Save as `screenshots/sentry_dashboard.png`

---

## Graceful Fallback

The `sentry.ts` utility uses a `try { require('@sentry/react') }` pattern:

- If `@sentry/react` is **not installed** → logs `[Sentry] SDK not installed` and all calls no-op
- If `VITE_SENTRY_DSN` is **not set** → logs `[Sentry] Not initialised` and all calls no-op
- **App never breaks** due to monitoring failures

This allows the codebase to ship without the `@sentry/react` package if desired.

---

## Architecture

```
main.tsx
  └── initSentry()
      │
      └── Sentry.init({ dsn, environment, release })
          │
          ▼
App.tsx
  └── setSentryUser(walletAddress) on connect/disconnect
      │
      ▼
useTickets.ts (all mutations catch blocks)
  └── captureContractError(error, method, contractId, wallet)
      │
      ▼
stellar.ts (connectStellarWallet catch)
  └── captureWalletError(error, walletAddress)
```

---

## Error Context Example

When a `purchase_ticket` Soroban call fails, Sentry receives:

```json
{
  "exception": "Transaction submission error: ...",
  "tags": {
    "area": "contract",
    "contract_method": "purchase_ticket",
    "contract_id": "CA5PG7SD",
    "wallet_prefix": "GABC1234"
  },
  "user": {
    "id": "GABC1234DEFG5678HIJK9012...",
    "username": "GABC1234..."
  },
  "release": "ticketchain@1.0.0",
  "environment": "production"
}
```

---

## `ignoreErrors` Configuration

The following patterns are intentionally excluded from Sentry to avoid noise:

```typescript
ignoreErrors: [
  'User rejected',    // Freighter user pressed Cancel
  'user rejected',
  'Transaction rejected',
]
```

---

## Verification Checklist

```
⬜ Sentry project created at sentry.io
⬜ npm install @sentry/react completed
⬜ VITE_SENTRY_DSN set in .env and Netlify env vars
⬜ Deployed to Netlify
⬜ Sentry Issues dashboard accessible
⬜ Test error captured (wallet error flow triggered)
⬜ Performance dashboard showing Web Vitals
⬜ Screenshots taken for LEVEL4_EVIDENCE.md
```
