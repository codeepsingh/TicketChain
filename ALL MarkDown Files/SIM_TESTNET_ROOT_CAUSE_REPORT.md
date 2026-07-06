# SIM/TESTNET Root Cause Report

## Problem

TicketChain was mixing Simulator Mode and Testnet Mode data in a single shared
Zustand store, causing all ticket purchases on Testnet to fail with:

```
HostError: Error(WasmVm, InvalidAction)
data: [wallet_address, 0, 1]
```

---

## Root Cause

The store had **one unified `events` array and one unified `tickets` array**
shared by both modes. Three compounding failures:

### 1. Shared Event Array
`defaultEvents` (3 simulator seed events with no `onChain` flag) were
persisted and loaded on every app start, regardless of network mode.

### 2. Broken `onChain` Filter
`useEvents` tried to filter with `e.onChain === true` on testnet, but
`defaultEvents` did not have this field — it was `undefined`. The filter
worked for new code but not for events already persisted in `localStorage`
under the old schema, which could have `onChain: undefined` or `onChain: true`
(set incorrectly by `simCreateEvent` when mode was testnet).

### 3. eventId = 0 Corruption
When `createEvent` ran on Testnet:
- `invokeContract` could not decode `returnValue` from the signed transaction
- `eventId` fell back to `0`
- `simCreateEvent(..., forcedId=0)` wrote the event with ID `0` and `onChain: true`
- This event appeared in the Explore page
- User clicked purchase → contract received `event_id: 0` → panic `expect("Event not found")`

---

## Affected Files (Before Fix)

| File | Problem |
|---|---|
| `store/useTicketStore.ts` | Single `events[]` + `tickets[]` shared across both modes |
| `hooks/useTickets.ts` | `useEvents` used unreliable `onChain` flag filter; `simPurchaseTicket` used shared array |
| `services/stellar.ts` | `returnValue` decoded to `0` on failure; no validation on `eventId` |
| `App.tsx` | No enforcement of testnet mode; no purge of corrupt events |
| `pages/VerifyPage.tsx` | Read `tickets` directly from store (no mode separation) |
| `pages/TicketDetailsPage.tsx` | Read `tickets` directly from store (no mode separation) |

---

## Fix Applied

### Architecture Change: Dual-Array Store

The store was redesigned with completely **separated state slices**:

```
BEFORE:
  events: EventInfo[]    ← shared, both modes
  tickets: TicketInfo[]  ← shared, both modes

AFTER:
  simEvents: EventInfo[]     ← simulator only
  simTickets: TicketInfo[]   ← simulator only
  simVerifiers: Record<...>  ← simulator only

  testnetEvents: EventInfo[] ← testnet (on-chain) only
  testnetTickets: TicketInfo[] ← testnet only
```

**New persistence key**: `ticketchain-storage-v2` — forces a clean slate for
all existing users. Old corrupted localStorage data is abandoned.

### Per-Mode Mutation Enforcement

Every mutation now routes to the correct slice — no cross-contamination:

| Mutation | Simulator | Testnet |
|---|---|---|
| Create Event | → `simEvents` | → `testnetEvents` (via contract) |
| Purchase Ticket | → `simTickets` | → `testnetTickets` (via contract) |
| Transfer Ticket | → `simTickets` | → `testnetTickets` (via contract) |
| Verify Ticket | → `simTickets` | → `testnetTickets` (via contract) |

### Purchase Guard

Before calling the Testnet contract, `usePurchaseTicket` now verifies the
event exists in `testnetEvents`. If not found, it throws a clear error:

```
Event #X does not exist on Testnet. Only events created on-chain
can be purchased. Please use "Create Event" to deploy to the contract.
```

### eventId = 0 Prevention

`StellarService.createEvent` now:
1. Extracts `returnValue` from `simulation.result.retval` (preflight stage)
2. Falls back to `GetSuccessfulTransactionResponse.returnValue` (on-chain)
3. **Throws** if `eventId <= 0` — never stores a broken event

### App Mount Sanitization

On startup `App.tsx`:
1. Forces `networkMode: 'testnet'`
2. Validates and resets contract IDs if malformed
3. Calls `purgeInvalidTestnetEvents()` to remove any persisted ID-0 events

---

## Before / After Behavior

### Before

```
User opens app
  → 3 simulator events appear in Explore page (testnet mode)
  → User clicks Buy Ticket
  → purchaseMutation runs with eventId from simEvent
  → StellarService.purchaseTicket(contractId, wallet, eventId=0, qty=1)
  → Contract: expect("Event not found") → UnreachableCodeReached
  → Error: WasmVm InvalidAction
```

### After

```
User opens app (testnet mode)
  → testnetEvents = [] (empty until user creates on-chain event)
  → Explore page shows "No Events Found" (correct)
  → User creates event via CreateEventPage
  → Contract: create_event → returns eventId = 3
  → store.addTestnetEvent({ id: 3, ... }) → pushed to testnetEvents only
  → Explore page shows new event (correct, from testnetEvents)
  → User clicks Buy Ticket
  → purchaseMutation validates event exists in testnetEvents
  → StellarService.purchaseTicket(contractId, wallet, eventId=3, qty=1)
  → Freighter popup → user signs → contract executes
  → Ticket stored in testnetTickets only
```

---

## Validation Checklist

- [x] Simulator mode: sim events never appear in testnet
- [x] Testnet mode: sim events never appear, only on-chain events
- [x] Create Event (testnet): event appears in testnetEvents after creation
- [x] Purchase Ticket (testnet): validates event exists in testnetEvents before calling contract
- [x] eventId=0 corruption: throws clearly, never stored
- [x] VerifyPage: reads from correct mode-specific array
- [x] TicketDetailsPage: reads from correct mode-specific array
- [x] Persistence key bumped to v2: old corrupted data abandoned
- [x] TypeScript build: passes with zero errors
