# Meal Points Implementation Plan

> **For agentic workers:** Use the plan task by task. Shared workspace, no worktree.

**Goal:** Build and validate a usable local meal-plan tracker, then save reusable cloud setup.
**Architecture:** React components compose the shell, summary, meal form, activity, and plan dialog. Pure model helpers own arithmetic and validation; storage owns the versioned persistence boundary.
**Tech Stack:** React, TypeScript, Vite, DM Sans, Lucide, Node tests, Playwright Chromium.
**Spec:** ../specs/2026-10-26-meal-points-design.md

## Global constraints

Use the existing isolated checkout. Preserve the pre-existing blank `the app` file. Source creation is explicitly authorized by the user's request to create a new app. Never introduce credentials or fake spending. Node >=22.18. Use a writable npm cache at /workspace/.cache/npm. No external services. No user-facing loopback preview links during onboarding.

## Review focus

- Decimal points retain exact precision after add/delete.
- End date today, expired dates, DST and invalid dates produce coherent budgets.
- Malformed storage is not overwritten by mounting the app; failed writes are visible.
- Overspending and smaller revised balances show the real negative balance.
- Mobile navigation, dialog focus, export quoting and empty filters work.

## Tasks

- [x] 1. Model and storage: write failing Node behavior tests for arithmetic, validation, date boundaries, malformed/denied storage and CSV injection; run tests; implement helpers and rerun. Interfaces in delegated task and exported types in src/lib/model.ts. Files: src/lib/model.ts, src/lib/storage.ts, tests/*.test.ts.
- [x] 2. Working UI: create browser tests for plan setup → log meal → reload → filter → delete/undo and mobile use; run against initial shell to establish missing functionality. Implement src/App.tsx and focused components with the reference design; verify browser tests, typecheck and production build.
- [x] 3. Final validation: review all changes, compare reference and desktop/mobile screenshots, fix actual failures, verify production server and a clean npm ci. Document commands and limitations in README.md.
- [x] 4. Environment: save complete tested install_script and start_skill, reconcile repository identity/HEAD, and verify saved draft. Preserve live-process versus snapshot distinction. Publish is owned by the product/user.

## Execution notes

The user already asked us to handle the work and chose creation; proceed with sensible defaults without additional design approval. Implementation uses one helper agent for independent domain work and a fresh final review. Do not create a worktree. Do not claim a push or publication until verified.

## Completion evidence

Clean frozen installation, all 20 model/storage tests, TypeScript, production build, and all 12 desktop/mobile browser checks passed. Production preview completed an actual plan-and-meal transaction. Reference and screenshots were inspected; see docs/VALIDATION.md. Complete tested install_script and start_skill were saved to the cloud draft. Publication remains a product/user action.
