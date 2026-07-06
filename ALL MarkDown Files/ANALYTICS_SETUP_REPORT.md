# ANALYTICS & MONITORING SETUP REPORT — TicketChain
**Date:** 2026-07-06  
**Author:** Level 4 Compliance Validator  
**Status:** ⚠️ SETUP REQUIRED — Analytics and monitoring are not yet integrated

---

## Current State Assessment

| Requirement | Status | Details |
|---|---|---|
| **Analytics Integration** | ❌ Missing | No analytics SDK found in `package.json` or `index.html` |
| **Error Monitoring** | ❌ Missing | No `@sentry/react` or equivalent in dependencies |
| **Performance Monitoring** | ❌ Missing | No Lighthouse CI, Web Vitals, or performance SDK configured |
| **Usage Metrics** | ❌ Missing | No event tracking hooks in wallet connect or contract call flows |

---

## SECTION 1 — Analytics Integration Plan

### Recommended Tool: Google Analytics 4

**Why GA4:**
- Free, industry standard
- Easy SPA route change tracking
- Real-time dashboard for reviewer demonstration
- No GDPR server infrastructure required for a demo app

### Implementation Steps

#### Step 1: Create GA4 Property
1. Visit https://analytics.google.com/
2. Create a new property: `TicketChain Testnet`
3. Set up a Web data stream pointing to `https://ticketchain1.netlify.app/`
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

#### Step 2: Add GA4 Script to `index.html`

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Add these lines before the closing `</head>` tag in `frontend/index.html`.

#### Step 3: Create Analytics Utility

Create `frontend/src/utils/analytics.ts`:

```typescript
/**
 * TicketChain Analytics Utility
 * Wraps GA4 gtag calls with TypeScript type safety
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};
```

#### Step 4: Integrate Event Tracking

Add the following tracking calls:

| Location | Event Name | Params |
|---|---|---|
| `stellar.ts: connectWallet()` | `wallet_connect` | `{ wallet_type: walletName }` |
| `stellar.ts: disconnectWallet()` | `wallet_disconnect` | `{}` |
| `useTickets.ts: useCreateEvent onSuccess` | `event_created` | `{ event_name, ticket_price }` |
| `useTickets.ts: usePurchaseTicket onSuccess` | `ticket_purchased` | `{ event_id, quantity }` |
| `useTickets.ts: useTransferTicket onSuccess` | `ticket_transferred` | `{ ticket_id }` |
| `useTickets.ts: useVerifyTicket onSuccess` | `ticket_verified` | `{ ticket_id }` |
| `App.tsx: route changes` | `page_view` | `{ page_path }` |

#### Step 5: Route Change Tracking

Add to `App.tsx`:

```typescript
import { useLocation } from 'react-router-dom';
import { trackPageView } from './utils/analytics';

// Inside App component:
const location = useLocation();
useEffect(() => {
  trackPageView(location.pathname, document.title);
}, [location]);
```

#### Step 6: Verify in GA4 Real-Time
- Visit GA4 Real-Time dashboard
- Open https://ticketchain1.netlify.app/ in another tab
- Confirm page_view events appear in the dashboard

---

## SECTION 2 — Error Monitoring Setup (Sentry)

### Recommended Tool: Sentry

**Why Sentry:**
- Industry standard for JavaScript error monitoring
- Free tier sufficient for demo app
- React-native integration with `@sentry/react`
- Captures uncaught exceptions, contract call failures, and performance data

### Implementation Steps

#### Step 1: Create Sentry Project
1. Visit https://sentry.io/ and create a free account
2. Create a new React project
3. Copy the **DSN** (Data Source Name)

#### Step 2: Install Sentry SDK

```bash
cd frontend
npm install @sentry/react
```

#### Step 3: Initialize in `main.tsx`

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://[YOUR-SENTRY-DSN]@sentry.io/[PROJECT-ID]',
  environment: import.meta.env.MODE,
  release: 'ticketchain@1.0.0',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Step 4: Add Error Boundary to `App.tsx`

```tsx
import * as Sentry from '@sentry/react';

// Wrap routes with error boundary:
<Sentry.ErrorBoundary 
  fallback={<div>Something went wrong. Please refresh the page.</div>}
  showDialog
>
  <Routes>
    {/* ... existing routes ... */}
  </Routes>
</Sentry.ErrorBoundary>
```

#### Step 5: Capture Contract Errors

In `useTickets.ts` catch blocks:

```typescript
import * as Sentry from '@sentry/react';

// In catch blocks:
} catch (error: any) {
  Sentry.captureException(error, {
    tags: { contract_method: 'create_event' },
    extra: { contractId: store.managerContractId, wallet: store.walletAddress },
  });
  store.updateTransaction(txId, 'failed');
  throw error;
}
```

---

## SECTION 3 — Performance Monitoring

### Web Vitals Tracking

Add to `main.tsx`:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

const reportWebVital = ({ name, delta, id }: { name: string; delta: number; id: string }) => {
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    });
  }
};

onCLS(reportWebVital);
onFID(reportWebVital);
onFCP(reportWebVital);
onLCP(reportWebVital);
onTTFB(reportWebVital);
```

Install: `npm install web-vitals`

---

## SECTION 4 — Usage Metrics to Track

### Key Performance Indicators (KPIs)

| Metric | Description | Target |
|---|---|---|
| **DAU (Daily Active Users)** | Unique wallet connections per day | 10+ during review period |
| **Events Created** | Total on-chain events created via app | 5+ |
| **Tickets Purchased** | Total ticket purchase transactions | 20+ |
| **Wallet Connect Rate** | % of sessions that connect a wallet | 50%+ |
| **Transaction Success Rate** | % of submitted txs that confirm | 90%+ |
| **Error Rate** | Sentry reported errors per session | < 5% |
| **Avg Session Duration** | Time users spend on the platform | 3+ minutes |

---

## SECTION 5 — Monitoring Dashboard Setup

### Netlify Analytics (Free, Built-in)
1. Go to Netlify Dashboard → Site → Analytics
2. Enable Netlify Analytics (free tier available)
3. View page views, unique visitors, and top pages

### Suggested Metrics Dashboard

For the Level 4 submission, screenshot your:
1. GA4 Real-Time active users dashboard
2. GA4 Events dashboard showing tracked contract interactions
3. Sentry Issues dashboard (should be empty = healthy app)
4. Netlify Analytics page views

---

## SECTION 6 — Environment Variables for Analytics

Add to `frontend/.env`:

```env
VITE_TICKET_MANAGER_CONTRACT=CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O
VITE_TICKET_ESCROW_CONTRACT=CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3
VITE_TICKET_TOKEN_CONTRACT=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://[DSN]@sentry.io/[PROJECT]
```

---

## Summary

| Step | Tool | Time | Status |
|---|---|---|---|
| 1. GA4 Account Setup | Google Analytics 4 | 15 min | ⬜ Not Done |
| 2. Add GA4 Script | `frontend/index.html` | 5 min | ⬜ Not Done |
| 3. Create Analytics Utility | `frontend/src/utils/analytics.ts` | 20 min | ⬜ Not Done |
| 4. Add Event Tracking | `useTickets.ts`, `stellar.ts` | 30 min | ⬜ Not Done |
| 5. Sentry Account Setup | Sentry.io | 10 min | ⬜ Not Done |
| 6. Install Sentry SDK | `npm install @sentry/react` | 5 min | ⬜ Not Done |
| 7. Initialize Sentry | `main.tsx` | 10 min | ⬜ Not Done |
| 8. Add Error Boundaries | `App.tsx` | 15 min | ⬜ Not Done |
| 9. Capture Contract Errors | `useTickets.ts` | 20 min | ⬜ Not Done |
| 10. Web Vitals Tracking | `main.tsx` | 15 min | ⬜ Not Done |
| **Total** | | **~2.5 hours** | ⬜ Not Done |
