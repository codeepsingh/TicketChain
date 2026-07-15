# 🌐 Deployment Report — TicketChain

This report outlines the deployment setup, build configurations, and live environment configuration for the **TicketChain** web application.

---

## 1. Netlify Build Configuration (`netlify.toml`)

The application deployment is configured using a `netlify.toml` file at the root of the repository:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Configuration Details:
- **Base Directory (`base`)**: `frontend` — Instructs Netlify to run all build commands and resolve packages inside the `frontend` subdirectory.
- **Build Command (`command`)**: `npm run build` — Executes the TypeScript compiler and Vite bundler (`tsc -b && vite build`) to generate optimized production assets.
- **Publish Directory (`publish`)**: `dist` — Deploys the built static assets from `frontend/dist`.
- **Redirects (`[[redirects]]`)**: Routes all incoming traffic to `index.html` with a `200` status. This is critical to enable client-side routing (React Router) and prevent `404` errors when reloading subpages.

---

## 2. Environment Variables

To bind the frontend to the correct Soroban smart contracts on the Stellar Testnet, the following environment variables must be configured in the Netlify project settings:

| Variable Name | Purpose | Example Value |
|---|---|---|
| `VITE_MANAGER_CONTRACT_ID` | Contract ID of the deployed TicketManager | `CD3A...` |
| `VITE_ESCROW_CONTRACT_ID` | Contract ID of the deployed TicketEscrow | `CC3X...` |
| `VITE_STELLAR_NETWORK` | The Stellar Network targeted by the app | `testnet` |
| `VITE_RPC_URL` | Soroban RPC node endpoint | `https://soroban-testnet.stellar.org` |
| `VITE_HORIZON_URL` | Horizon API endpoint | `https://horizon-testnet.stellar.org` |

*Note: In the absence of custom environment variables, the codebase automatically falls back to pre-configured Testnet contracts to ensure out-of-the-box readiness.*

---

## 3. Production Deployment Details

- **Production URL**: [https://ticketchain1.netlify.app](https://ticketchain1.netlify.app)
- **Deployment Status**: Live and Operational.
- **SSL Certificate**: Managed and auto-renewed by Netlify (Let's Encrypt).

---

## 4. Deployment Workflow

The application can be deployed using two synchronized methods:

### Method A: Git-Triggered Continuous Deployment
1. A developer pushes a commit to the `main` branch.
2. Netlify detects the change, triggers a build container, runs `npm run build` inside `/frontend`, and deploys the generated `dist` folder.
3. This is the primary method for non-CI builds.

### Method B: GitHub Actions CI/CD Pipeline Deployment
1. A commit is pushed or a PR is merged to `main`.
2. The GitHub Actions runner checks out the codebase, verifies smart contract tests, installs node packages, and runs Vite build.
3. If all tests pass, the runner invokes the `netlify-cli` using repository secrets to push a production release:
   ```bash
   npx netlify deploy --dir=frontend/dist --prod --auth="${{ secrets.NETLIFY_AUTH_TOKEN }}" --site="${{ secrets.NETLIFY_SITE_ID }}"
   ```
4. This ensures that only code that passes all smart contract and frontend tests is published to production.
