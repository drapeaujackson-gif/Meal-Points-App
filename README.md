# Meal Points

A personal meal-plan tracker. Set your points balance and an end date, log meals, and see how much you can spend each day.

## What works

- Named meal plans with an editable starting balance and end date.
- Remaining points, total spending, and a daily allowance that includes today.
- Meals with a place, point cost, category, and date.
- Activity filters, place search, CSV export, and deletion with undo.
- Saved browser data, recovery download for unreadable data, and coordinated updates across tabs.
- Responsive desktop/mobile layout and keyboard-accessible forms and dialogs.

Points use two decimal places and are calculated as integer hundredths. Overspending is shown as a negative balance. An expired or overdrawn plan has a daily allowance of zero.

## Development

Use Node.js 22.18 or newer (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

In this cloud workspace, use a writable npm cache:

```sh
cd /workspace/Meal-Points-App
npm ci --cache /workspace/.cache/npm --no-fund --no-audit
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

The cloud task is already isolated. Use its existing checkout; no Git worktree is needed. No environment variables, credentials, database, or API services are required.

## Validation

```sh
npm test          # Arithmetic, dates, validation, CSV, and persistence tests
npm run build    # TypeScript checks and production build in dist/
npm run test:e2e # Desktop and mobile Chromium workflows
```

Browser tests use `/usr/bin/chromium` when available, otherwise Playwright's Chromium. On a machine without Chromium, install it once with `npx playwright install chromium`. The test runner starts a local Vite server automatically and writes temporary results outside the checkout.

To check the production build:

```sh
npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
```

## Your data

Data is stored in `localStorage` under `meal-points:v1`, scoped to this browser and website address. There is no account, server backup, or campus meal-card connection. Clearing site data removes the plan and meals. Export the activity CSV for a portable record. CSV exports the whole history and escapes spreadsheet formulas in user text; it is not an import/restore format.

Use HTTPS when hosting the app. Modern browsers' Web Locks API coordinates writes between tabs and prevents one tab from silently dropping another tab's meals; it is also available on localhost during development. If safe storage access is unavailable, the app reports the issue instead of pretending to save. Different ports/hostnames have separate data stores, so development and production-preview data are separate.

## Project layout

- `src/components/`: dashboard, meal form, activity list, navigation, and plan dialog.
- `src/lib/model.ts`: types, integer points arithmetic, dates, and CSV export.
- `src/lib/storage.ts`: versioned data validation and storage errors.
- `src/App.tsx`: state, serialized storage mutations, and notifications.
- `tests/`: model/storage tests and real browser interaction tests.

The original blank file `the app` is preserved. The application starts from `index.html` and `src/main.tsx`.
