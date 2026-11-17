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

### Checkout (`tests/checkout.spec.ts`)

| Test | Verifies |
| --- | --- |
| Complete checkout | The overview shows the selected product with subtotal, tax and total matching the known baseline; finishing shows the confirmation and removes the cart badge. |
| Required customer details | Each missing field is validated in turn, and correcting the errors preserves earlier entries and reaches the order overview. |

## Defects and observations

Observed manually on the live demo site outside the scripted suite. Severity is a provisional assessment of potential impact in a production system, not an agreed product severity. The named demo accounts may intentionally exhibit faults. Confirm intended behaviour and requirements before treating these observations as product defects.

| ID | Severity | Summary | Steps | Expected vs actual |
| --- | --- | --- | --- | --- |
| DEF-01 | High | Cart contents are shared between different users in the same browser | Add a product as `standard_user`; log out; log in as `error_user` in the same browser | Proposed expectation: a different user should not inherit the previous user's cart; confirm the product requirement. Actual: `error_user` sees the backpack left by `standard_user`. In a production system, this could create privacy or order-integrity risk. |
| DEF-02 | Medium | Product sorting does not work for `problem_user` | Log in as `problem_user`; select Name (Z to A) in the sort dropdown | Expected: the list reorders. Actual: the dropdown reverts to A-to-Z and the order never changes. |
| DEF-03 | Medium | `error_user` cannot add the red T-shirt from its product page | Log in as `error_user`; open "Test.allTheThings() T-Shirt (Red)"; click Add to cart | Expected: the item is added and the button changes to Remove. Actual: nothing happens and no feedback is shown. |
| OBS-01 | Question | Cart quantities cannot be changed | Add any product and open the cart | There is no control to update the quantity, only Remove. Confirm whether the requirement expects quantity editing. |

Priority recommendation: investigate DEF-01 first because cart contents crossed user boundaries in the same browser. DEF-02 and DEF-03 affect specific demo accounts; verify their intended behaviour. Once requirements are agreed, automate relevant regression tests.

## Limitations

A passing run provides Chromium desktop coverage only. It is not evidence of cross-browser, accessibility, performance or security compliance. The suite asserts visible behaviour; it cannot verify backend state such as whether a duplicate order was created. The checkout test asserts the demo backpack's price and tax as a known baseline, so legitimate changes to the demo catalogue require review rather than blind updates.

## Prerequisites

- Node.js 20 or later and npm. This project was validated with Node.js 24.22.3 and npm 11.19.1.
- Internet access to npm, the Playwright browser download service, and Sauce Demo.
- Playwright's Chromium browser and its operating-system dependencies. On supported Linux distributions, `npx playwright install --with-deps chromium` installs both browser and system dependencies (may require elevated privileges). On other systems, use `npx playwright install chromium`.

## Setup and run

From the repository root:

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

Useful alternatives:

```bash
npm run test:headed      # visible browser; requires a graphical environment
npm run test:ui          # Playwright interactive UI
npm test -- --workers=4  # exercise tests in parallel
npm run test:report      # open the HTML report after a run
```

The default target is `https://www.saucedemo.com`. For a compatible alternative environment, set `BASE_URL` before running, for example:

```bash
BASE_URL=https://example.com npm test
```

Failure diagnostics (screenshots and traces) are retained under `test-results/`, and the HTML report is written to `playwright-report/`. These generated outputs and dependencies are excluded from version control. Avoid sharing traces from environments that contain sensitive data.

## Continuous integration

**Planned, not yet configured:** Add a GitHub Actions workflow to run the Chromium regression suite on pushes to `main`, pull requests targeting `main`, and manual dispatch. The proposed workflow installs dependencies and Chromium, runs the TypeScript check and tests, and retains the Playwright report and failure diagnostics for seven days. The workflow has not yet been committed or validated on GitHub Actions.

A failing run requires investigation: the suite targets an external demo site, so a network or site outage can cause failures unrelated to a change in this repository. A passing run does not establish cross-browser coverage.

## Structure and design

- `playwright.config.ts` — browser, base URL, test-ID attribute, reporting and failure diagnostics.
- `pages/login-page.ts` — login and logout interactions.
- `pages/shop-page.ts` — shared cart, sorting and checkout interactions.
- `tests/auth.spec.ts`, `tests/sorting.spec.ts`, `tests/cart.spec.ts`, `tests/checkout.spec.ts` — scenarios grouped by feature area.
- `tests/support.ts` — shared sign-in helper and product-order readers.
- `package-lock.json` — locked dependency versions for repeatable installs.

Small page objects keep selectors and routine interactions together; assertions stay in the tests so the business intent is visible. Navigation-sensitive helpers wait for the destination page, so tests do not race page loads. Sauce Demo exposes `data-test` attributes, configured as Playwright's test ID attribute, alongside accessible roles and placeholders. Sorting tests compute the expected order instead of hard-coding catalogue contents. The suite relies on Playwright's automatic waiting instead of fixed sleeps.

## To Do / next steps

Prioritised by risk; the first items are the current defects above, followed by coverage proposals for the team.

1. Automate regression tests for DEF-01 to DEF-03 once expected behaviour is agreed.
2. Additional checkout data cases: whitespace-only values, leading/trailing spaces, apostrophes and hyphens, accented and non-English names, numbers-only names, boundary lengths, postal-code formats including leading zeros, and HTML-like input handled safely as text.
3. Empty-cart checkout behaviour, duplicate submission (double-click Finish, refresh after confirmation — noting backend verification limits), order review with multiple products, and checkout cancellation retaining the cart.
4. Cart persistence across navigation and refresh, and cart behaviour after sorting.
5. Accessibility: automated checks on key pages plus keyboard navigation, visible focus, field labels and error feedback; automated checks alone do not establish full compliance.
6. Add and validate the proposed CI workflow, then consider Firefox and WebKit for broader browser coverage.
7. Broader account exploration (`visual_user`, `performance_glitch_user`) to distinguish seeded defects from unclear requirements.

## AI usage and ownership

Veneet selected Playwright, agreed the initial scenarios and supplied the defect observations that seeded the exploration. Hyperagent assisted with analysing the brief, proposing the test approach, generating the project and README, executing the tests, and diagnosing and correcting a selector-configuration issue and navigation races found during repeat runs. A separate AI subagent was asked to inspect the public demo site and suggest selectors and expected behaviours; it did not create a custom skill or persistent agent. No custom AI skills or persistent agents were created for the assignment. The candidate is responsible for reviewing the implementation, understanding the design choices and confirming that the final submission reflects their own assessment and decisions.

## Validation performed

All eleven tests were run against the live Sauce Demo site in Chromium. `npm ci` and `npm run typecheck` succeeded, and the full suite passed in three consecutive four-worker runs and one single-worker run; a fresh extraction and `npm ci` also passed the full suite with four workers. The validation environment reported that its operating system was not officially supported by Playwright and used an Ubuntu 24.04 fallback browser build; results can vary if the demo site or network changes.
