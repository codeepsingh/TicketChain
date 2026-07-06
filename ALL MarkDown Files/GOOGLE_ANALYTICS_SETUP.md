# Google Analytics 4 — Setup Guide
**Project:** TicketChain  
**Date:** 2026-07-06  
**Status:** ✅ Code integrated — Measurement ID configuration required

---

## What Was Implemented

| File | Change |
|---|---|
| `frontend/src/utils/analytics.ts` | Full GA4 utility with 20+ typed tracking functions |
| `frontend/index.html` | GA4 loader script (dynamically loads gtag.js) |
| `frontend/src/App.tsx` | Route-change page view tracking via `useLocation` |
| `frontend/src/hooks/useTickets.ts` | Event tracking on every mutation success + failure |
| `frontend/src/services/stellar.ts` | Wallet connect/disconnect tracking |

---

## Events Tracked

| GA4 Event Name | Trigger | Parameters |
|---|---|---|
| `page_view` | Every route change | `page_path`, `page_title`, `page_location` |
| `wallet_connected` | Freighter wallet connect | `wallet_type`, `wallet_address_prefix` |
| `wallet_disconnected` | Wallet disconnect | — |
| `event_created` | Successful on-chain event creation | `event_name`, `ticket_price_xlm`, `max_tickets`, `tx_hash` |
| `ticket_purchased` | Successful ticket purchase | `event_id`, `quantity`, `total_cost_xlm`, `tx_hash` |
| `ticket_transferred` | Successful ticket transfer | `ticket_id`, `tx_hash` |
| `ticket_verified` | Successful gate verification | `ticket_id`, `tx_hash` |
| `event_cancelled` | Event cancellation | `event_id`, `tx_hash` |
| `event_completed` | Escrow payout released | `event_id`, `tx_hash` |
| `refund_claimed` | Buyer refund claimed | `event_id`, `ticket_id`, `tx_hash` |
| `transaction_success` | Any tx confirmation | `transaction_label`, `tx_hash` |
| `transaction_failed` | Any tx failure | `transaction_label`, `error_message` |
| `app_error` | Wallet/contract/network errors | `error_type`, `error_message` |
| `dashboard_viewed` | Dashboard page opened | `dashboard_type` |
| `gate_scanner_opened` | Verify page opened | — |
| `feedback_form_opened` | Feedback link clicked | — |

---

## Setup Instructions (One-Time)

### Step 1: Create GA4 Property

1. Go to https://analytics.google.com/
2. Click **Admin** → **Create Property**
3. Name it `TicketChain Testnet`
4. Set timezone and currency
5. Choose **Web** platform
6. Enter URL: `https://ticketchain1.netlify.app/`
7. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Set the Measurement ID

Open `frontend/index.html` and find this line:

```javascript
var GA_ID = 'G-XXXXXXXXXX'; // ← REPLACE with real Measurement ID
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### Step 3: Add Environment Variable (Optional)

In `frontend/.env`:

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

In Netlify dashboard → Site settings → Environment variables → Add:
- Key: `VITE_GA4_MEASUREMENT_ID`
- Value: `G-XXXXXXXXXX`

### Step 4: Verify Integration

1. Open https://ticketchain1.netlify.app/ in a browser
2. Go to GA4 → **Reports** → **Real-Time**
3. You should see yourself as an active user
4. Navigate between pages — watch page_view events appear
5. Connect Freighter wallet — watch `wallet_connected` event appear

### Step 5: Screenshot for Level 4 Evidence

Take a screenshot of:
- GA4 Real-Time dashboard with active users
- GA4 Events dashboard showing `wallet_connected`, `ticket_purchased`, etc.
- Save as `screenshots/ga4_realtime.png` and `screenshots/ga4_events.png`

---

## Architecture

```
index.html
  └── GA4 gtag.js loaded (if GA_ID configured)
      │
      ▼
App.tsx (useLocation)
  └── trackPageView() on every route change
      │
      ▼
stellar.ts (connectStellarWallet)
  ├── trackWalletConnected()
  └── trackError('wallet', ...)
      │
      ▼
useTickets.ts (all mutations)
  ├── trackEventCreated()     → onSuccess
  ├── trackTicketPurchased()  → onSuccess
  ├── trackTicketTransferred() → onSuccess
  ├── trackTicketVerified()   → onSuccess
  ├── trackEventCancelled()   → onSuccess
  ├── trackEventCompleted()   → onSuccess
  ├── trackRefundClaimed()    → onSuccess
  ├── trackTransactionSuccess() → every confirmation
  └── trackTransactionFailed()  → every catch block
```

---

## Key Design Decisions

- **Manual page views**: GA4 `send_page_view: false` prevents duplicate tracking with HashRouter
- **No PII**: Only wallet address prefix (8 chars) is sent — never full address
- **Graceful degradation**: All analytics calls silently no-op if GA4 is not loaded
- **Dev console**: In development, all events log to `console.debug` for verification
- **Cookie consent**: Not required for Testnet demo; add consent banner for production

---

## Verification Checklist

```
⬜ GA4 property created
⬜ Measurement ID replaced in index.html
⬜ Deployed to Netlify
⬜ Real-Time dashboard shows active users
⬜ page_view events firing on route changes
⬜ wallet_connected event fires on Freighter connect
⬜ ticket_purchased event fires on purchase
⬜ Screenshots taken for LEVEL4_EVIDENCE.md
```
