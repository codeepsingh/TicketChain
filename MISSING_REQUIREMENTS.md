# Missing Requirements

This document logs all identified gaps and missing requirements identified during the TicketChain codebase compliance audit, ranked by severity.

---

## 1. Frontend Test Suites
* **Rank**: HIGH
* **Requirement**: Level 3 Compliance - Frontend Tests
* **Problem**: The Vite React frontend does not have any testing harness (such as Vitest, Jest, or Cypress) configured, and there are no unit or integration tests written for components, router boundaries, or hooks.
* **Location**: `frontend/` (root configuration and dependency definitions in `package.json`).
* **Required Fix**: 
  1. Install Vitest, Happy DOM, and `@testing-library/react` devDependencies.
  2. Add a `test` run script to `package.json` configurations.
  3. Author test files for core utilities, page routing, and hook triggers (e.g., wallet connect actions and ticket store updates).
* **Estimated Time**: 4 Hours

---

## 2. Event Subscription Streaming
* **Rank**: MEDIUM
* **Requirement**: Level 3 Compliance - Event Streaming
* **Problem**: The frontend implements pull-based query refetching upon successful mutations but lacks support for actual event subscription streaming (such as Server-Sent Events from a Horizon endpoint or polling `rpcServer.getEvents`).
* **Location**: `frontend/src/services/stellar.ts` and `frontend/src/hooks/useTickets.ts`.
* **Required Fix**: 
  1. Add a background polling thread or EventStream connection to the Horizon/Soroban RPC server.
  2. Implement state triggers that catch on-chain contract events (`ticket_purchased`, `ticket_transferred`, `ticket_verified`) and dynamically trigger query cache invalidation in React Query.
* **Estimated Time**: 3 Hours
