# Sauce Demo — Playwright QA automation

A risk-focused end-to-end suite for [Sauce Demo](https://www.saucedemo.com/), built with Playwright Test and TypeScript. The suite covers the critical purchase journey and key failure paths, and documents defects and further coverage proposals for the team.

## Test coverage

Tests are grouped by feature area under `tests/`. Each test runs in an isolated browser context and signs in for itself, so failures do not depend on execution order.

### Authentication (`tests/auth.spec.ts`)

| Test | Verifies |
| --- | --- |
| Valid login | A standard user reaches the inventory, sees the Products heading, a non-empty catalogue and shopping controls. |
| Incorrect password | A clear error appears, the user stays logged out and cannot reach the inventory. |
| Locked-out account | `locked_out_user` is refused with a clear error and no session is created. |
| Missing fields | Submitting an empty form, then a missing password, produces the correct required-field errors. |
| Slow demo user | `performance_glitch_user` reaches the inventory using a bounded, condition-based wait. Elapsed time is attached for information, not judged against an unagreed performance target. |
| Logout and route protection | Logging out ends the session, and directly reopening `/inventory.html` is refused with a clear error. |

### Sorting (`tests/sorting.spec.ts`)

| Test | Verifies |
| --- | --- |
| Name sorting | The default order is alphabetical, and Z-to-A reverses it, comparing against independently computed expected orders rather than hard-coded lists. |
| Price sorting | Price low-to-high and high-to-low order the catalogue correctly in cents. |

### Shopping cart (`tests/cart.spec.ts`)

| Test | Verifies |
| --- | --- |
| Add and remove one product | The badge updates, the cart shows the correct name, price and quantity, and removal empties the cart. |
| Multiple products | Two products appear with correct names and prices, removal works from the inventory page, and the remaining product stays in the cart. |
| Cart persistence (`@core`) | Two selected products, prices, quantities and the badge persist through navigation and page refresh in the same browser session. |

### Checkout (`tests/checkout.spec.ts`)

| Test | Verifies |
| --- | --- |
| Complete checkout (`@core`) | Two selected products and their prices carry through to the overview. Integer-cent assertions check the subtotal against the items and the total against subtotal plus displayed tax. Finishing shows confirmation and removes the cart badge. |
| Required customer details | Each missing field is validated in turn, and correcting the errors preserves earlier entries and reaches the order overview. |

## Defects and observations

Observed on the live demo site outside the scripted regression suite, through interactive exploration and standalone browser checks. Severity is a provisional assessment of potential impact in a production system, not an agreed product severity. The named demo accounts may intentionally exhibit faults. Confirm intended behaviour and requirements before treating these observations as product defects.

| ID | Severity | Summary | Steps | Expected vs actual |
| --- | --- | --- | --- | --- |
| DEF-01 | High | Cart contents are shared between different users in the same browser | Add a backpack as `standard_user`; log out; log in as `performance_glitch_user` in the same browser and open the cart | Proposed expectation: a different user should not inherit the previous user's cart; confirm the product requirement. Actual: `performance_glitch_user` sees the backpack left by `standard_user`. In a production system, this could create privacy or order-integrity risk. |
| DEF-02 | Medium | Product sorting does not work for `problem_user` | Log in as `problem_user`; select Name (Z to A) in the sort dropdown | Expected: the list reorders. Actual: the dropdown reverts to A-to-Z and the order never changes. |
| DEF-03 | Medium | `error_user` cannot add the red T-shirt from its product page | Log in as `error_user`; open "Test.allTheThings() T-Shirt (Red)"; click Add to cart | Expected: the item is added and the button changes to Remove. Actual: nothing happens and no feedback is shown. |
| OBS-01 | Question | Cart quantities cannot be changed | Add any product and open the cart | There is no control to update the quantity, only Remove. Confirm whether the requirement expects quantity editing. |
| OBS-02 | Question | Duplicate-looking item in the lazy-load catalogue | Log in as `performance_glitch_user`; open Dynamic Catalog > Lazy Load | Two separate cards displayed `Test.allTheThings() T-Shirt (Red) (L)` at `$15.99` with the same image. Confirm product identifiers and catalogue requirements before treating this as a duplicate SKU defect. |

Priority recommendation: investigate DEF-01 first because cart contents crossed user boundaries in the same browser. DEF-02 and DEF-03 affect specific demo accounts; verify their intended behaviour. Once requirements are agreed, automate relevant regression tests.

## Limitations

The complete suite runs in desktop Chromium; the `@core` login, cart persistence and checkout tests are also configured for Firefox and WebKit. Browser-engine checks are not equivalent to testing branded browsers and devices, or real Safari on macOS/iOS. The suite does not establish accessibility, performance or security compliance. It asserts visible behaviour and cannot verify backend state such as duplicate order persistence. Checkout arithmetic checks consistency with the displayed tax, not the correctness of an unspecified tax policy.

## Prerequisites

- Node.js 20 or later and npm. This project was validated with Node.js 24.22.3 and npm 11.19.1.
- Internet access to npm, the Playwright browser download service, and Sauce Demo.
- Playwright's Chromium, Firefox and WebKit browsers and their operating-system dependencies. On supported Linux distributions, `npx playwright install --with-deps chromium firefox webkit` installs browsers and system dependencies (may require elevated privileges). On other systems, use `npx playwright install chromium firefox webkit`.

## Setup and run

From the repository root:

```bash
npm ci
npx playwright install chromium firefox webkit
npm run typecheck
npm test
```

Useful alternatives:

```bash
npm run test:headed      # visible browser; requires a graphical environment
npm run test:ui          # Playwright interactive UI
npm test -- --workers=4  # exercise tests in parallel
npm run test:report      # open the HTML report after a run
npx playwright test --project=chromium  # full Chromium suite
npx playwright test --grep @core       # small core across all configured engines
```

The default target is `https://www.saucedemo.com`. For a compatible alternative environment, set `BASE_URL` before running, for example:

```bash
BASE_URL=https://example.com npm test
```

Failure diagnostics (screenshots and traces) are retained under `test-results/`, and the HTML report is written to `playwright-report/`. These generated outputs and dependencies are excluded from version control. Avoid sharing traces from environments that contain sensitive data.

## Continuous integration

The GitHub Actions workflow in `.github/workflows/regression.yml` is intended to run the full Chromium suite plus the `@core` Firefox and WebKit tests on pushes to `main`, pull requests targeting `main`, and manual dispatch. It must install all three browsers before running the suite. It uploads the Playwright report and available failure diagnostics as an artifact retained for seven days; see the Actions tab for the latest results. The [cross-browser CI run](https://github.com/vinnz-lab/FH_Test01/actions/runs/44193733604) passed, including the type check, test step and report upload.

A failing run requires investigation: the suite targets an external demo site, so a network or site outage can cause failures unrelated to a change in this repository. Passing a core subset across three engines does not establish complete cross-browser coverage.

## Coverage and design

| Component | Responsibility |
| --- | --- |
| `pages/login-page.ts` | Login and logout interactions. |
| `pages/shop-page.ts` | Product, cart, sorting and checkout interactions. |
| `tests/support.ts` | Shared sign-in helper and product-order readers. |
| `tests/auth.spec.ts` | Successful and rejected login, slow-user handling and route protection. |
| `tests/cart.spec.ts` | Cart contents, removal and persistence. |
| `tests/checkout.spec.ts` | Checkout validation, order review and completion; includes the integer-cents conversion helper. |
| `tests/sorting.spec.ts` | Name and price ordering. |
| `playwright.config.ts` | Browser projects, isolation, reporting and failure diagnostics. |
| `.github/workflows/regression.yml` | CI setup, test execution and report upload. |
| `package-lock.json` | Locked dependency versions for repeatable installs. |

Small page objects keep interactions and selectors reusable; assertions remain visible in the tests. Each test receives an isolated Playwright browser context and uses the UI to authenticate where needed, avoiding shared mutable login state and dependence on test order. Navigation-sensitive helpers wait for destination content.

Locators use user-facing roles or placeholders where appropriate and the application's `data-test` attributes as an explicit selector contract. Sorting checks compare the displayed sequence against a sorted copy of the original names or prices, wait for the expected order, and check that multiple distinct values are present. Names use JavaScript's `localeCompare` in the execution environment; requirements for punctuation, case and locale should be agreed before treating ambiguous ordering as a defect.

The checkout test carries two selected products and their displayed prices from the cart to the order overview. It converts dollar values to integer cents and checks the item sum, subtotal and total against displayed tax. This checks arithmetic consistency, not whether an unspecified tax rate is correct or whether a displayed price matches an external price source.

The full suite runs in Chromium; the `@core` login, cart-persistence and checkout tests also run in Firefox and WebKit. Playwright WebKit is an engine check, not certification of real Safari on macOS or iOS. Automated accessibility scans and keyboard-navigation checks are **not implemented** in this project; they are future work and automated checks alone would not establish accessibility compliance.

The suite relies on condition-based waits rather than fixed sleeps. The slow-user test has a bounded 45-second test timeout and 15-second condition waits; it records elapsed time but does not assess performance against an unagreed SLA.

## Accounts and data

The baseline uses Sauce Demo's publicly displayed `standard_user` and demo password `secret_sauce`. `locked_out_user` exercises rejection, and `performance_glitch_user` exercises slow login. Manual observations also involve `problem_user` and `error_user`; those observations are not part of the automated regression suite. These are public demo credentials, not production secrets. Checkout data is synthetic and no personal customer information is required.

The checkout flow has first name, last name and postal code fields; it does not have an email field, so the suite does not invent an email test. Country-specific postal-code rules and field lengths need product clarification. Legitimate names may include accents, apostrophes, hyphens and non-English characters; broader input coverage is listed in To Do rather than claimed as implemented.

## To Do / next steps

Prioritised by risk; the first items are the current defects above, followed by coverage proposals for the team.

1. Automate regression tests for DEF-01 to DEF-03 once expected behaviour is agreed.
2. Additional checkout data cases: whitespace-only values, leading/trailing spaces, apostrophes and hyphens, accented and non-English names, numbers-only names, boundary lengths, postal-code formats including leading zeros, and HTML-like input handled safely as text.
3. Empty-cart checkout behaviour, duplicate submission (double-click Finish, refresh after confirmation — noting backend verification limits), and checkout cancellation retaining the cart.
4. Cart behaviour after sorting and agreed expectations for carts across different users.
5. Accessibility: automated checks on key pages plus keyboard navigation, visible focus, field labels and error feedback; automated checks alone do not establish full compliance.
6. Broaden cross-browser coverage beyond the core subset and verify on real devices.
7. Agree performance budgets before judging `performance_glitch_user` timing; investigate the dynamic catalogue with reliable product identifiers. Explore `visual_user` separately.

## AI usage and ownership

Veneet provided the assignment and brief, contributed the test approach and priorities, and raised observable issues on the site. An AI agent helped refine the test plan and generated the project code and README; it also ran tests, investigated findings, and helped diagnose failures. A separate AI subagent was asked to inspect the public demo site and suggest selectors and expected behaviours. The subagent's task was strictly read-only: inspect the public Sauce Demo site and report the selectors, credentials and expected behaviour it observed, without creating or running any tests or making any changes. A second subagent performed a read-only review of the repository against the brief, without running tests or making changes. No custom AI skills or persistent agents were created for this assignment, and there is no AI dependency when running the tests.
## Validation performed

The updated suite passed all 13 Chromium tests and TypeScript checking locally; the slow-user test was also run successfully twice in isolation. The configured matrix has 19 executions: all 13 tests in Chromium and three core tests each in Firefox and WebKit. The cross-browser GitHub Actions run passed its test and type-check steps. Three `@core` tests are configured for each of Firefox and WebKit. In the local sandbox, Firefox could not access the site due to `SEC_ERROR_UNKNOWN_ISSUER`, and WebKit could not launch because system dependencies were missing; neither is treated as a product defect. These local limitations were followed by a passing cross-browser run in GitHub Actions. Results can vary if the demo site or network changes.
