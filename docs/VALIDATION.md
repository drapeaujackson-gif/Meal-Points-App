# Validation notes

The app was checked in the cloud workspace with Node 24.19.0 and Chromium 154. Playwright was used because the Browser plugin is not available.

## Functional checks

Final clean-install result: **20/20 model/storage tests, 12/12 browser tests, TypeScript and production build passed**. The invalid-amount correction test also passed five consecutive focused runs.

- Model/storage tests: decimal precision, date boundaries and DST, overspending, CSV quoting/formula protection, invalid schemas, blocked storage and recovery data.
- Browser tests at 1505 × 1045 and 390 × 844: set plan → log meal → reload → filter/search → export → delete/undo. Also keyboard dismissal/focus restoration, corrupt data, blocked reads, and simultaneous edits in two tabs.
- Production preview: set 500 points, log 12.50, verify 487.50 remains. Page identity, content, inputs and assets rendered without browser errors; mobile had no horizontal overflow.

## Visual comparison

Reference: [design concept](superpowers/specs/meal-points-concept.png). The concept and final desktop/mobile captures were inspected directly with the image viewer. Native reference viewport: 1505 × 1045. Temporary browser captures are outside the checkout under `/tmp/meal-points-qa`.

| Comparison | Result |
| --- | --- |
| Layout | Sidebar, two-column summary/activity and allowance/form arrangement retained; mobile becomes one column with compact navigation. |
| Typography | DM Sans, bold two-line heading, large balance numerals, deliberate control and caption sizes. |
| Palette | Near-white page, white panels, forest balance, lime numerals and selection, orange activity link retained. |
| Spacing and containers | Corrected the heading-to-panel gap, balance line height, and allowance divider spacing against the concept. |
| Copy | Navigation, heading, section labels, controls, helper text and empty state match the reference. |
| Icons and assets | Consistent Lucide outlines implement utensils, navigation and bowl metaphors; no raster screenshot is used as UI. |

Intentional functional differences: the date field defaults to today; stored data replaces empty-state values and copy; local storage uses a lock icon rather than a gear; the activity link uses a diagonal arrow; mobile reorders allowance/form before activity. Dialogs and recovery/error states extend the same design system. No material visual defects remain in the inspected screens. This is a faithful implementation of the builder-selected concept, with the listed functional adaptations.

## Review fixes

Independent review reproduced concurrent-tab meal loss, writes after unreadable storage, and plan draft replacement on external updates. Regression tests failed first. Mutations now read and write under a Web Lock, read failures block saving, and modal drafts initialize only when opening. The regression tests pass.

A clean-install run also exposed a browser test timing issue: the test tried to fill the inert background meal form before the plan dialog closed. Trace screenshots showed a missing location, rather than a lost saved meal. The test now waits for dialog dismissal and verifies the filled location before continuing; its accounting assertions remain unchanged.

## Scope

Chromium desktop and mobile viewport behavior was exercised. Safari, Firefox, public hosting, campus integration, cross-device sync and restoration into a newly published cloud task have not been tested. The app intentionally has no backend or account system.
