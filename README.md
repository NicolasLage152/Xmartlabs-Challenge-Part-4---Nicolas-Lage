# 🧪 SauceDemo E2E Test Automation

[![Playwright E2E Tests](https://github.com/NicolasLage152/Xmartlabs-Challenge-Part-4---Nicolas-Lage/actions/workflows/playwright.yml/badge.svg)](https://github.com/NicolasLage152/Xmartlabs-Challenge-Part-4---Nicolas-Lage/actions/workflows/playwright.yml)

Automated end-to-end test suite for [SauceDemo](https://www.saucedemo.com/) built with **Playwright + TypeScript**, targeting the `performance_glitch_user` as specified in the Xmartlabs QA Automation challenge.

> 📊 **Latest Test Report**: [GitHub Pages — Live Report](https://nicolaslage152.github.io/Xmartlabs-Challenge-Part-4---Nicolas-Lage/)

---

## 📋 Table of Contents

- [Tech Stack & Rationale](#-tech-stack--rationale)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Running the Tests](#-running-the-tests)
- [Test Scenarios](#-test-scenarios)
- [Design Decisions](#-design-decisions)
- [Performance Glitch Strategy](#-performance-glitch-strategy)
- [CI/CD Pipeline](#-cicd-pipeline-github-actions)
- [Known Limitations](#-known-limitations)

---

## 🛠 Tech Stack & Rationale

| Technology | Why |
|---|---|
| **[Playwright](https://playwright.dev/)** | Modern E2E framework with built-in auto-waiting, auto-retrying assertions, and native multi-browser support. Its auto-waiting mechanism is critical for handling the `performance_glitch_user` without static sleeps. |
| **TypeScript** | Type safety, IDE autocompletion, and compile-time error detection — essential for maintainable test code in a team environment. |
| **Page Object Model (POM)** | Encapsulates UI interactions per page, reducing duplication and isolating changes when the UI evolves. |
| **Playwright Custom Fixtures** | Injects POM instances automatically into each test via dependency injection, eliminating manual instantiation boilerplate. |
| **dotenv** | Manages environment variables for credentials, supporting both local `.env` files and CI secret injection. |

---

## 📁 Project Structure

```
saucedemo-e2e-tests/
├── .github/
│   └── workflows/
│       └── playwright.yml           # CI/CD: matrix, caching, Pages deploy, email
├── playwright.config.ts             # Global timeouts, reporters, browser projects
├── package.json                     # Dependencies and npm scripts
├── tsconfig.json                    # TypeScript strict config
├── .env.example                     # Environment variable template
├── .gitignore
├── README.md
└── src/
    ├── config/
    │   └── env.config.ts            # Env var loading + fail-fast validation
    ├── fixtures/
    │   └── pomFixtures.ts           # Custom Playwright fixtures for DI of POMs
    ├── pages/
    │   ├── LoginPage.ts             # Login screen interactions
    │   ├── InventoryPage.ts         # Product listing + cart badge
    │   ├── ProductDetailPage.ts     # Product detail + add-to-cart
    │   ├── CartPage.ts              # Cart verification + checkout trigger
    │   └── CheckoutPage.ts          # Checkout info → overview → confirmation
    ├── utils/
    │   └── priceUtils.ts            # parsePrice() — centralized "$29.99" → 29.99
    └── tests/
        ├── purchase-flow.spec.ts    # 🔴 Mandatory: E2E purchase (performance_glitch_user)
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
git clone https://github.com/NicolasLage152/Xmartlabs-Challenge-Part-4---Nicolas-Lage.git
cd Xmartlabs-Challenge-Part-4---Nicolas-Lage

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials (see .env.example for the required variables)

# 4. Install Playwright browsers
npx playwright install --with-deps
```

> **Note**: Step 4 downloads Chromium, Firefox, and WebKit. To install only one browser: `npx playwright install --with-deps chromium`.

---

## ▶ Running the Tests

| Command | Description |
|---|---|
| `npm test` | Run all tests across all configured browsers |
| `npm run test:headed` | Run with browser window visible |
| `npm run test:mandatory` | Run only the mandatory E2E purchase flow (`@mandatory` tag) |
| `npm run test:bonus` | Run only the bonus pricing validation (`@bonus` tag) |
| `npm run test:debug` | Step-by-step debugging with Playwright Inspector |
| `npm run test:ui` | Interactive UI mode with time-travel debugging |
| `npm run report` | Open the HTML report from the last run |

### Run a specific browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## 🎯 Test Scenarios

### 🔴 Mandatory: E2E Purchase Flow (`purchase-flow.spec.ts`)

Validates the complete purchase journey using `performance_glitch_user`:

| Step | Action | Assertion |
|:---:|---|---|
| 0 | Login with `performance_glitch_user` | Redirected to `/inventory.html` |
| 1 | Select "Sauce Labs Backpack" → open Product Detail | Product name matches |
| 2 | Add to cart from Product Detail page | "Remove" button appears |
| 3 | Return to inventory via "Back to Products" | Cart badge shows `1` |
| 4 | Navigate to Cart | Product is present in cart |
| 5 | Fill checkout information | Navigated to overview |
| 6 | Verify pricing (subtotal + tax = total) | Math is correct |
| 7 | Finish order | "Thank you for your order!" confirmation |

### 🟢 Bonus: Checkout Price Calculation (`checkout-pricing.spec.ts`)

Validates mathematical integrity of checkout pricing with 2 products:

- **Sum of individual item prices** = displayed subtotal
- **Subtotal + tax** = displayed total
- Handles JavaScript floating-point precision via `toFixed(2)` + `parseFloat()`

> Uses `standard_user` to isolate the pricing validation from performance concerns — the mandatory test already covers the glitch user.

---

## 🧩 Design Decisions

### 1. Page Object Model with Playwright Fixtures (Dependency Injection)

Instead of manual POM instantiation in each test:

```typescript
// ❌ Manual (boilerplate-heavy)
const loginPage = new LoginPage(page);

// ✅ Fixture injection (clean, DRY)
test('my test', async ({ loginPage, inventoryPage }) => {
  await loginPage.goto();
});
```

Fixtures are defined in [`pomFixtures.ts`](src/fixtures/pomFixtures.ts) and automatically provide typed POM instances to every test.

### 2. Selector Strategy: `data-test` Attributes

All selectors use SauceDemo's `data-test` attributes exclusively (e.g., `[data-test="login-button"]`):
- **Resilient** to CSS/visual redesigns
- **Self-documenting** — selectors reveal intent
- **Stable** — purpose-built for testing, not coupled to implementation

### 3. `test.step()` for Structured Reporting

Every logical action is wrapped in `test.step()`, producing clearly labeled sections in the HTML report. When a test fails, you see *which step* failed — not just a stack trace.

### 4. Floating-Point Precision Handling

JavaScript's IEEE 754 arithmetic can produce results like `29.99 + 9.99 = 39.980000000000004`. We normalize before comparing:

```typescript
const calculated = parseFloat((subtotal + tax).toFixed(2));
expect(calculated).toBe(total);
```

### 5. Centralized `parsePrice()` Utility

All price string parsing (`"$29.99"` → `29.99`) goes through a single [`parsePrice()`](src/utils/priceUtils.ts) function, ensuring consistent regex and error handling across all POMs.

### 6. Fail-Fast Environment Validation

[`env.config.ts`](src/config/env.config.ts) validates all required environment variables at startup. If any are missing, the suite fails immediately with a descriptive error — no cryptic failures deep in a test.

---

## ⏱ Performance Glitch Strategy

The `performance_glitch_user` intentionally injects **~5 second delays** into login, page transitions, and other interactions. Our strategy handles this **without any static sleeps or hardcoded waits**.

### ❌ What We DON'T Do

```typescript
// NEVER — fragile, slow, unreliable
await page.waitForTimeout(5000);
await new Promise(resolve => setTimeout(resolve, 5000));
```

### ✅ What We DO Instead

#### 1. Extended Timeouts (Centralized in Config)

All timeout tuning is in [`playwright.config.ts`](playwright.config.ts) — not scattered across tests:

```typescript
use: {
  actionTimeout: 15_000,     // 15s for clicks, fills (3× the ~5s glitch)
  navigationTimeout: 30_000, // 30s for page navigations
},
expect: {
  timeout: 15_000,           // 15s for auto-retrying assertions
},
timeout: 120_000,            // 2min global test timeout (cumulative delays)
```

#### 2. Auto-Retrying Assertions

Playwright's `expect()` polls continuously until the condition is met or timeout expires:

```typescript
// Handles ~5s login delay — polls until URL changes
await expect(page).toHaveURL(/inventory/);

// Handles slow renders — polls until text appears
await expect(title).toHaveText('Products');
```

#### 3. Built-in Auto-Waiting on Actions

Playwright automatically waits for elements to be **attached**, **visible**, **stable**, and **enabled** before `click()`, `fill()`, etc. This inherently handles delayed renders.

### Why This Approach Is Superior

| Static Sleeps | Dynamic Waits (our approach) |
|---|---|
| Always wait the full duration | Continue as soon as condition is met |
| Fail silently if app is slower | Fail with clear timeout error |
| Waste CI time on every run | Only wait as long as needed |
| Mask real performance regressions | Surface them through timeout failures |

---

## 🤖 CI/CD Pipeline (GitHub Actions)

The project includes a production-grade CI/CD pipeline ([`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)) that goes beyond basic test execution.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Triggers                                 │
│   push (main) │ pull_request (main) │ schedule (3AM) │ manual   │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌─────────┐   ┌─────────┐   ┌─────────┐
     │Chromium │   │ Firefox │   │ WebKit  │   ← Matrix Strategy
     │(blob)   │   │(blob)   │   │(blob)   │
     └────┬────┘   └────┬────┘   └────┬────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
              ┌────────────────────┐
              │  Merge Reports     │  ← Consolidate blob reports
              │  into single HTML  │
              └─────────┬──────────┘
                        │
               ┌────────┼────────┐
               ▼        ▼        ▼
          ┌────────┐ ┌──────┐ ┌──────┐
          │Artifact│ │Pages │ │Email │
          │Upload  │ │Deploy│ │Notify│
          └────────┘ └──────┘ └──────┘
```

### Key Features

#### 1. 🔄 Nightly Scheduled Runs

```yaml
schedule:
  - cron: '0 3 * * *'  # Every day at 3:00 AM UTC
```

Runs the full suite daily — catches environmental regressions, third-party API changes, or SauceDemo updates **before** they affect development.

#### 2. 🌐 Matrix Strategy (Cross-Browser)

```yaml
strategy:
  fail-fast: false
  matrix:
    browser: [chromium, firefox, webkit]
```

Tests run in parallel across **3 browser engines**. `fail-fast: false` ensures all browsers report results even if one fails.

#### 3. 🧠 Smart Browser Caching

```yaml
key: ${{ runner.os }}-playwright-${{ env.PLAYWRIGHT_VERSION }}-${{ matrix.browser }}
```

Caches Playwright browser binaries (~500MB) with a version-aware key. On cache hit, only OS-level dependencies are installed — **saving 1-2 minutes per run**.

#### 4. 📊 Blob Report Merging

Each matrix job produces a **blob report** (`--reporter=blob`). A dedicated `merge-reports` job consolidates them into a single interactive HTML report covering all browsers.

#### 5. 🚀 GitHub Pages Deployment

The consolidated HTML report is automatically deployed to GitHub Pages on `push` and `schedule` events (not PRs), providing a persistent, zero-download URL for stakeholders:

> 📊 [https://nicolaslage152.github.io/Xmartlabs-Challenge-Part-4---Nicolas-Lage/](https://nicolaslage152.github.io/Xmartlabs-Challenge-Part-4---Nicolas-Lage/)

#### 6. 📧 Email Notifications

On every pipeline completion (success or failure), an email is dispatched with:
- Test execution status
- Direct link to the GitHub Pages report

### 🔐 Secrets Configuration

To run the pipeline, configure the following **Repository Secrets** in GitHub (*Settings > Secrets and variables > Actions*):

| Secret | Purpose | Example |
|---|---|---|
| `SAUCE_STANDARD_USER` | SauceDemo standard user login | `standard_user` |
| `SAUCE_GLITCH_USER` | SauceDemo performance glitch user login | `performance_glitch_user` |
| `SAUCE_PASSWORD` | SauceDemo password | `secret_sauce` |
| `SMTP_SERVER` | Email server address | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USERNAME` | Email sender username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email sender password / app password | `xxxx-xxxx-xxxx-xxxx` |
| `EMAIL_RECIPIENT` | Notification recipient | `team@company.com` |

> **Note**: The SMTP secrets are only required for email notifications. The pipeline will run tests and deploy reports without them (the email step will fail gracefully).

---

## ⚠ Known Limitations

1. **No test data isolation**: SauceDemo is a shared stateless demo app — there is no risk of data pollution between tests. In a real-world application, setup/teardown hooks or API-based data seeding would be necessary.

2. **Tax rate not validated**: The bonus test verifies that `subtotal + tax = total` but does not assert the tax *rate* (e.g., 8%), as SauceDemo does not document the expected rate in its UI.

3. **No visual regression testing**: This suite focuses on functional E2E validation. Playwright's screenshot comparison (`toHaveScreenshot()`) could be added as a complementary visual layer.

4. **No API-level tests**: All validations are performed through the UI. In a production suite, API tests would complement UI tests for faster feedback loops on business logic.

---

## 📄 License

ISC
