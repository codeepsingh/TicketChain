# 🚀 CI/CD Pipeline Report — TicketChain

This report documents the automated Continuous Integration and Continuous Deployment (CI/CD) workflow implemented for **TicketChain**. It explains the pipeline architecture, jobs, and deployment triggers.

---

## 1. Workflow File & Trigger Configuration

- **Workflow Configuration File**: `.github/workflows/ci-cd.yml`
- **Trigger Events**:
  - **Pushes**: Automatically runs on every push to the `main` branch.
  - **Pull Requests**: Automatically runs on every PR targeting the `main` branch.

---

## 2. Pipeline Job 1: Build & Test Soroban Contracts

The `contracts` job validates the integrity, compilation, and unit tests of the Rust-based Soroban smart contracts.

| Step | Action/Command | Purpose |
|---|---|---|
| **Checkout Code** | `actions/checkout@v4` | Pulls the repository code into the CI runner. |
| **Install Rust** | `dtolnay/rust-toolchain@stable` | Installs the stable Rust toolchain and target `wasm32-unknown-unknown`. |
| **Cache Dependencies** | `swatinem/rust-cache@v2` | Caches Cargo build artifacts to speed up builds. |
| **Build Contracts** | `cargo build --target wasm32-unknown-unknown` | Compiles the smart contracts to WebAssembly. |
| **Run Tests** | `cargo test` | Executes all Rust/Soroban unit tests in the contract workspace. |

- **Runner OS**: `ubuntu-latest`
- **Output Artifacts**: Validated `.wasm` binaries.

---

## 3. Pipeline Job 2: Build, Test & Deploy Vite Frontend

The `frontend` job executes once the `contracts` job passes successfully (`needs: contracts`). It tests, compiles, and deploys the React web app.

| Step | Action/Command | Purpose |
|---|---|---|
| **Checkout Code** | `actions/checkout@v4` | Pulls the repository code into the runner. |
| **Install Node.js** | `actions/setup-node@v4` | Sets up Node.js v20 with npm caching enabled. |
| **Install Deps** | `npm ci` | Installs npm dependencies from `package-lock.json`. |
| **Run Tests** | `npm run test` | Executes the Vitest unit tests for the frontend. |
| **Build Frontend** | `npm run build` | Compiles and bundles the Vite app into static files in `frontend/dist`. |
| **Start Deployment** | `chrnorm/deployment-action@v2` | Registers a deployment event on GitHub. |
| **Deploy to Netlify** | `npx netlify deploy --dir=frontend/dist --prod` | Deploys static files to Netlify (details below). |
| **Update Status** | `chrnorm/deployment-status@v2` | Updates GitHub deployment to `success` or `failure`. |

- **Runner OS**: `ubuntu-latest`

---

## 4. Netlify Deployment Integration

The deployment step is securely wired using repository secrets:
1. **Secrets**: Uses `${{ secrets.NETLIFY_AUTH_TOKEN }}` and `${{ secrets.NETLIFY_SITE_ID }}`.
2. **Fallback / Guard**: If the secrets are not set (e.g. on fork pull requests), the step logs a warning, falls back to the default production URL (`https://ticketchain1.netlify.app`), and exits successfully (`exit 0`) to prevent pipeline failure.
3. **Command**:
   ```bash
   npm install netlify-cli
   npx netlify deploy --dir=frontend/dist --prod --auth="$NETLIFY_AUTH_TOKEN" --site="$NETLIFY_SITE_ID"
   ```
4. **URL Extraction**: The script greps the Netlify CLI stdout to capture the live URL and exports it to GitHub Actions outputs for the deployment status update.

---

## 5. Reviewer Verification Steps

Reviewers can verify CI/CD execution by:
1. Navigating to the **Actions** tab of the GitHub repository.
2. Selecting the latest run corresponding to a commit on `main`.
3. Verifying that both **Build & Test Soroban Contracts** and **Build, Test & Deploy Vite Frontend** jobs display green checkmarks.
4. Clicking the **Deployments** panel on the repository homepage to view live deployment logs and the final deployment URL.
