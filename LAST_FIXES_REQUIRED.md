# Last Fixes Required

The following improvements are required to achieve 100% compliance with Level 3 audit specifications before submission:

---

## 1. Implement Event Subscription Streaming (Level 3)
* **Requirement**: Dynamic event streaming using Horizon Event Stream or RPC Event subscription.
* **Current State**: The frontend uses cache invalidation pull-queries on mutation success. It does not dynamically listen to a stream of events from the ledger.
* **Exact Fix Needed**:
  - Add an Event listener connection in `stellar.ts` or a hook using Horizon's `stream` callback.
  - Subscription logic draft:
    ```typescript
    import { horizonServer } from './stellar';
    
    export const streamLedgerEvents = (contractId: string, onEvent: (event: any) => void) => {
      return horizonServer.events()
        .forTarget(contractId)
        .cursor('now')
        .stream({
          onmessage: (event) => {
            onEvent(event);
          },
          onerror: (error) => {
            console.error('Event stream error:', error);
          }
        });
    };
    ```
  - Call this stream inside a root context provider or dashboard page to alert users when a ticket is purchased or verified in real-time.

---

## 2. Frontend Test Suites Configuration (Level 3)
* **Requirement**: Automated unit/integration tests for frontend components and routing.
* **Current State**: The `frontend` directory lacks test runner configurations or spec files.
* **Exact Fix Needed**:
  - Install testing tools:
    ```bash
    cd frontend
    npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
    ```
  - Register the testing pipeline in `vite.config.ts`:
    ```typescript
    /// <reference types="vitest" />
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite';

    export default defineConfig({
      plugins: [react(), tailwindcss()],
      test: {
        globals: true,
        environment: 'happy-dom',
        setupFiles: './src/test/setup.ts',
      },
    });
    ```
  - Write test specs under `src/__tests__/useTicketStore.test.ts` to assert mock-connection and checkout behaviors.
