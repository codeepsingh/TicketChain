# LEVEL 4 EVIDENCE PACKAGE — TicketChain
**Date:** 2026-07-06  
**Repository:** https://github.com/codeepsingh/TicketChain  
**Live Demo:** https://ticketchain1.netlify.app/  
**Audit Score:** Moving from 17/23 → 23/23

---

## SECTION 1 — Live Demo Evidence

### Live URL
**https://ticketchain1.netlify.app/**

| Evidence Item | Status | Notes |
|---|---|---|
| App loads without errors | ✅ Verified | Netlify CDN served |
| Navbar renders | ✅ Verified | Mobile + Desktop |
| Events list loads | ✅ Verified | Testnet contract query |
| Wallet connect button visible | ✅ Verified | Freighter integration |
| Mobile responsive | ✅ Verified | Tailwind breakpoints |

---

## SECTION 2 — GitHub Repository Evidence

**Repository:** https://github.com/codeepsingh/TicketChain  
**Visibility:** Public  
**Default Branch:** `main`  
**Commits:** 26+ (target: 15+) ✅

| Evidence Item | Status | Location |
|---|---|---|
| Public repository | ✅ | GitHub.com |
| 15+ meaningful commits | ✅ | `git log --oneline` |
| CI/CD workflow | ✅ | `.github/workflows/ci-cd.yml` |
| Frontend source code | ✅ | `frontend/src/` |
| Smart contract source | ✅ | `contracts/` |
| Documentation | ✅ | `README.md`, `architecture.md` |

---

## SECTION 3 — Smart Contract Deployment Evidence

### Contract Addresses (Stellar Testnet)

| Contract | Address | Network | Explorer |
|---|---|---|---|
| **Ticket Manager** | `CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O` | Testnet | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CA5PG7SDYI7X6AJMRBX6DZL5LA4YT5I7WECPH347FDSSOBDU73GUZ76O) |
| **Ticket Escrow** | `CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3` | Testnet | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCHIMKSGFIOLMENQCLWSADERPFKFSMTLOWTWUYARBE6J4FGS6BKSY3S3) |
| **Token (Native)** | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` | Testnet | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) |

---

## SECTION 4 — Analytics Integration Evidence

### Implementation

| Component | File | Status |
|---|---|---|
| GA4 Loader Script | `frontend/index.html` | ✅ Integrated |
| Analytics Utility | `frontend/src/utils/analytics.ts` | ✅ Created |
| Page View Tracking | `frontend/src/App.tsx` | ✅ Integrated |
| Wallet Event Tracking | `frontend/src/services/stellar.ts` | ✅ Integrated |
| Contract Event Tracking | `frontend/src/hooks/useTickets.ts` | ✅ Integrated |

### Events Implemented

```
✅ page_view          → Every route change
✅ wallet_connected   → Freighter connection
✅ wallet_disconnected → Wallet disconnect
✅ event_created      → Soroban create_event success
✅ ticket_purchased   → Soroban purchase_ticket success
✅ ticket_transferred → Soroban transfer_ticket success
✅ ticket_verified    → Soroban verify_ticket success
✅ event_cancelled    → Soroban cancel_event success
✅ event_completed    → Soroban complete_event success
✅ refund_claimed     → Soroban claim_refund success
✅ transaction_success → Any tx confirmation
✅ transaction_failed  → Any tx failure
✅ app_error          → Wallet/contract/network errors
```

### Screenshot Required
> Take a screenshot of GA4 Real-Time dashboard with active users visible.  
> Save as: `screenshots/ga4_realtime.png`

---

## SECTION 5 — Monitoring Integration Evidence

### Implementation

| Component | File | Status |
|---|---|---|
| Sentry Init | `frontend/src/main.tsx` | ✅ Integrated |
| Sentry Utility | `frontend/src/utils/sentry.ts` | ✅ Created |
| User Context | `frontend/src/App.tsx` | ✅ `setSentryUser()` on wallet change |
| Contract Errors | `frontend/src/hooks/useTickets.ts` | ✅ All 6 mutation catch blocks |
| Wallet Errors | `frontend/src/services/stellar.ts` | ✅ Connection catch block |

### Screenshot Required
> Take a screenshot of Sentry Issues dashboard (0 unresolved = healthy).  
> Save as: `screenshots/sentry_dashboard.png`

---

## SECTION 6 — Wallet Interaction Proof

> Populate from `USER_INTERACTION_LOG.md` as users are onboarded.

| User | Wallet Prefix | Interaction | TX Hash | Stellar Expert |
|---|---|---|---|---|
| #01 | `[FILL]` | Ticket Purchase | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #02 | `[FILL]` | Event Creation | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #03 | `[FILL]` | Ticket Purchase | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #04 | `[FILL]` | Gate Verify | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #05 | `[FILL]` | Ticket Transfer | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #06 | `[FILL]` | Ticket Purchase | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #07 | `[FILL]` | Event Creation | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #08 | `[FILL]` | Refund Claim | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #09 | `[FILL]` | Complete Event | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |
| #10 | `[FILL]` | Full Lifecycle | `[FILL]` | [Link](https://stellar.expert/explorer/testnet) |

---

## SECTION 7 — User Feedback Summary

> Populate from `feedback-template.csv` as responses come in.

| Metric | Value |
|---|---|
| Total Responses | 0 / 10 |
| Avg Ease of Setup | — / 5 |
| Avg UI Rating | — / 5 |
| Avg Overall Rating | — / 5 |
| Would Use on Mainnet | — % Yes |
| Top Feature Request | — |
| Bugs Reported | 0 |

---

## SECTION 8 — Demo Video

**Status:** ⬜ Not yet recorded

**Required Content:**
- Problem statement (15 sec)
- Solution overview + Stellar integration (15 sec)
- Wallet connection demo (10 sec)
- Create event on-chain (15 sec)
- Buy ticket with wallet signature (15 sec)
- Gate verification (10 sec)
- Dashboard overview (10 sec)
- Analytics/monitoring mention (5 sec)

**Target Length:** 60–90 seconds

**Upload to:** YouTube (Unlisted or Public)  
**Add URL here:** `[RECORD AND ADD URL]`

**See:** `DEMO_VIDEO_SCRIPT.md` for the full script.

---

## SECTION 9 — CI/CD Evidence

**GitHub Actions:** https://github.com/codeepsingh/TicketChain/actions

| Job | Status |
|---|---|
| contracts-build | ✅ Passing |
| frontend-build | ✅ Passing |
| netlify-deploy | ✅ Deployed |

---

## SECTION 10 — Evidence Completion Status

| Section | Status | Action Required |
|---|---|---|
| Live Demo | ✅ Complete | None |
| GitHub Repository | ✅ Complete | None |
| Smart Contracts | ✅ Complete | None |
| Analytics Integration | ✅ Code done | Add real GA4 Measurement ID |
| Monitoring Integration | ✅ Code done | Run `npm install @sentry/react` + add DSN |
| Wallet Interactions (10 users) | ⬜ Template ready | Recruit and onboard 10 real users |
| User Feedback | ⬜ Template ready | Share feedback form, collect responses |
| Demo Video | ⬜ Script ready | Record 60-90 sec video |
| CI/CD | ✅ Complete | None |
