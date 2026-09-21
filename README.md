# 🧪 SauceDemo E2E Test Automation

Automated end-to-end test suite for the [SauceDemo](https://www.saucedemo.com/) web application, built with **Playwright** and **TypeScript**.

---

## 📋 Table of Contents

- [Tech Stack & Rationale](#-tech-stack--rationale)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Running the Tests](#-running-the-tests)
- [Design Decisions](#-design-decisions)
- [Performance Glitch Strategy](#-performance-glitch-strategy)
- [Known Limitations](#-known-limitations)

---

## 🛠 Tech Stack & Rationale

| Technology | Why |
|---|---|
| **[Playwright](https://playwright.dev/)** | Modern E2E framework with built-in auto-waiting, auto-retrying assertions, and first-class TypeScript support. Its native handling of slow pages makes it ideal for testing the `performance_glitch_user`. |
| **TypeScript** | Provides type safety, better IDE support (autocomplete, refactoring), and catches errors at compile time — critical for maintainable test code in a team setting. |
| **Page Object Model (POM)** | Separates page interaction logic from test logic, making tests readable and maintenance cost low when the UI changes. |
| **Playwright Test Runner** | Built-in test runner with parallel execution, HTML reporting, trace viewer, and fixtures — no need for external runners like Jest or Mocha. |

---

## 📁 Project Structure

```
saucedemo-e2e-tests/
├── playwright.config.ts         # Playwright configuration (timeouts, reporters, projects)
├── package.json                 # Dependencies and npm scripts
├── tsconfig.json                # TypeScript configuration
├── .gitignore
├── README.md
└── src/
    ├── fixtures/
    │   └── pomFixtures.ts       # Custom Playwright fixtures for POM injection
    ├── pages/
    │   ├── LoginPage.ts         # Login page interactions
    │   ├── InventoryPage.ts     # Product listing page + parsePrice utility
    │   ├── ProductDetailPage.ts # Individual product detail page
    │   ├── CartPage.ts          # Shopping cart page
    │   └── CheckoutPage.ts      # Checkout flow (info → overview → complete)
    └── tests/
        ├── purchase-flow.spec.ts    # 🔴 Mandatory: E2E purchase with glitch user
        └── checkout-pricing.spec.ts # 🟢 Bonus: Checkout math validation
```

---

## ⚙ Setup & Installation

### Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd saucedemo-e2e-tests

# 2. Install dependencies
npm install

# 3. Setup Environment Variables
# Copy the example file and configure it if necessary.
cp .env.example .env

# 4. Install Playwright browsers (Chromium, by default)
npx playwright install chromium
```

---

## ▶ Running the Tests

### Run all tests

```bash
npm test
```

### Run with browser visible (headed mode)

```bash
npm run test:headed
```

### Run only the mandatory test

```bash
npm run test:mandatory
```

### Run only the bonus test

```bash
npm run test:bonus
```

### Debug mode (step-by-step with inspector)

```bash
npm run test:debug
```

### Interactive UI mode

```bash
npm run test:ui
```

### View HTML report after a run

```bash
npm run report
```

---

## 🧩 Design Decisions

### 1. Page Object Model with Playwright Fixtures

Instead of manually instantiating POMs in each test (`const login = new LoginPage(page)`), we use **Playwright custom fixtures** (`src/fixtures/pomFixtures.ts`) to inject them automatically:

```typescript
test('my test', async ({ loginPage, inventoryPage }) => {
  await loginPage.goto();
  // Pages are ready to use — no boilerplate
});
```

This reduces repetition and ensures consistent POM initialization.

### 2. Selector Strategy: `data-test` Attributes

SauceDemo provides `data-test` attributes on all interactive elements (e.g., `[data-test="login-button"]`). We use these exclusively because they:
- Are **purpose-built** for testing (won't break on visual redesigns)
- Are more **stable** than CSS class names or XPath
- Communicate **intent** clearly (self-documenting selectors)

### 3. `test.step()` for Structured Reporting

Each logical step in the E2E flow is wrapped in `test.step()`, which:
- Produces **clearly labeled sections** in the HTML report
- Makes **failures easy to locate** (you see which step failed)
- Acts as living **documentation** of the user journey

### 4. Floating-Point Precision in Price Validation

JavaScript floating-point arithmetic can produce results like `29.99 + 9.99 = 39.980000000000004`. To handle this, we round to 2 decimal places using `toFixed(2)` before comparing:

```typescript
const calculated = parseFloat((29.99 + 9.99).toFixed(2)); // 39.98
expect(calculated).toBe(subtotal); // Exact match
```

### 5. Centralized `parsePrice()` Utility

All price parsing (`"$29.99"` → `29.99`) goes through a single `parsePrice()` function exported from `InventoryPage.ts`. This avoids scattered regex/parsing logic and ensures consistency.

---

## ⏱ Performance Glitch Strategy

The `performance_glitch_user` intentionally introduces **~5 second delays** on various interactions (login, page transitions, etc.). Here's how we handle it **without any static sleeps**:

### ❌ What we DON'T do

```typescript
// NEVER this — fragile, slow, unreliable
await page.waitForTimeout(5000);
await new Promise(resolve => setTimeout(resolve, 5000));
```

### ✅ What we DO instead

#### 1. Extended Timeouts in Configuration

```typescript
// playwright.config.ts
use: {
  actionTimeout: 15_000,     // 15s for clicks, fills, etc.
  navigationTimeout: 30_000, // 30s for page navigations
},
expect: {
  timeout: 15_000,           // 15s for auto-retrying assertions
},
timeout: 120_000,            // 2min global test timeout
```

#### 2. Auto-Retrying Assertions

Playwright's `expect()` assertions **poll continuously** until the condition is met or the timeout expires. This naturally waits for the glitch user's delayed responses:

```typescript
// Polls until URL contains "inventory" — handles the 5s login delay
await expect(page).toHaveURL(/inventory/);

// Polls until the element is visible — handles slow renders
await expect(title).toHaveText('Products');
```

#### 3. Built-in Auto-Waiting on Actions

Playwright automatically waits for elements to be **attached**, **visible**, **stable**, and **enabled** before performing actions like `click()` and `fill()`. This inherently handles delayed renders.

### Why This Approach is Superior

| Static Sleeps | Dynamic Waits (our approach) |
|---|---|
| Always wait the full duration | Continue as soon as condition is met |
| Fail silently if app is slower than expected | Fail with clear timeout error |
| Waste CI time on every run | Only wait as long as needed |
| Mask real performance regressions | Surface them through timeout failures |

---

## ⚠ Known Limitations

1. **Single browser**: Tests run on Chromium only. The config can be extended with Firefox/WebKit projects for cross-browser coverage.

2. **No test data isolation**: SauceDemo uses a shared, stateless demo app — there's no risk of data pollution between tests. In a real-world scenario, tests would need setup/teardown hooks for data isolation.

3. **Credentials Management**: Credentials for the test users are currently managed via a local `.env` file (and documented in `.env.example`). In a production CI/CD pipeline, these would be injected dynamically as GitHub Actions secrets (or equivalent) for maximum security.

4. **Tax calculation logic**: The bonus test validates that `subtotal + tax = total` but does not verify the tax *rate* itself (e.g., that it's exactly 8%). This is because the tax rate isn't documented in SauceDemo's UI and may vary.

5. **No visual regression testing**: This suite focuses on functional E2E validation. Visual regression tools (like Playwright's screenshot comparison) could be added as a complementary layer.

---

## 🤖 CI/CD Integration (GitHub Actions)

This project is fully configured for Continuous Integration via **GitHub Actions** (`.github/workflows/playwright.yml`), ensuring robust and automated quality checks.

### Key Pipeline Features

1. **Nightly Scheduled Runs (Cron)**
   - **Trigger:** `0 3 * * *` (3:00 AM daily).
   - **Value:** Ensures daily platform health monitoring even when no code changes are pushed, catching environmental or third-party regressions early.

2. **Matrix Strategy (Cross-Browser Execution)**
   - **Engines:** Chromium, Firefox, WebKit.
   - **Value:** The pipeline automatically parallelizes test execution across multiple browser engines, guaranteeing cross-browser compatibility and surfacing browser-specific rendering or behavioral bugs.

3. **Smart Caching**
   - **Implementation:** Caches Playwright browser binaries based on the OS and Playwright version (`~/.cache/ms-playwright`).
   - **Value:** Significantly reduces pipeline execution time and resource consumption by skipping massive browser downloads on subsequent runs. If a cache hit occurs, the pipeline intelligently installs only the missing OS-level dependencies.

### Secrets Configuration
To run the pipeline successfully, configure the following **Repository Secrets** in your GitHub repository (*Settings > Secrets and variables > Actions*):

- `SAUCE_STANDARD_USER` (e.g., `standard_user`)
- `SAUCE_GLITCH_USER` (e.g., `performance_glitch_user`)
- `SAUCE_PASSWORD` (e.g., `secret_sauce`)

---

## ☁️ Cloud Deployment (Test Reporting)

Visibility into test results is critical. This project automates the publication and cloud hosting of test reports to make them accessible to stakeholders without downloading files locally.

### Automated Artifact Uploads
On every pipeline run (success or failure), the framework generates an interactive HTML report containing step-by-step logs, screenshots, and traces. 
- GitHub Actions automatically uploads these as **Artifacts** (`playwright-report-chromium`, `playwright-report-firefox`, etc.).
- They are stored securely and available for download directly from the GitHub Actions run summary.

### GitHub Pages Hosting
To provide zero-friction access, the pipeline automatically deploys the HTML report to **GitHub Pages**.
- **How it works:** The `peaceiris/actions-gh-pages` step takes the generated report directory and publishes it to a dedicated `gh-pages` branch.
- **Accessibility:** Team members (Devs, QA, Managers) can click a persistent URL (e.g., `https://<org>.github.io/<repo>/`) to instantly view the latest interactive report in their browser.
- **Condition:** To prevent deployment race conditions across matrix jobs, the pages deployment is bound specifically to the successful completion of the `chromium` job.

*(Note: If a failure occurs, the pipeline also automatically dispatches an email notification containing the direct link to this cloud-hosted report).*
