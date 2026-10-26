# Meal Points

The user requested a new Meal Points app in the empty repository and asked us to handle the work. Implementation choices below are defaults selected by the builder.

A personal meal-plan tracker lets students set a starting points balance and plan end date, log meals, see remaining points and daily allowance, filter and delete history, and export a CSV. No credentials or backend are required. Data lives in versioned browser localStorage on this browser and origin; it does not sync with campus accounts or other devices. Begin with an honest empty state, never fictional user transactions.

## Approach

Build React + TypeScript + Vite with local storage. This gives a working app and cloud development workflow immediately. A hosted account/database version would provide sync but requires product decisions and external services; a static spreadsheet would not provide the requested app experience. No account system is included in this first version.

## Design

Reference: ./meal-points-concept.png, 1505 × 1045. This builder-selected concept has a white sidebar, warm near-white background, dark forest balance panel, lime numerals, white bordered daily allowance and form panels, and an activity panel. Native HTML controls and text; no screenshot UI. DM Sans, forest #173f35, lime #d5ed9c, background #fafaf7, muted #69717e, borders #e2e5df. Desktop sidebar ~270px at reference dimensions, main padding32px, two-column content ~1.74:1. Headline 68px, balance 120px, section titles26px, body18px. Collapse into one column with compact top navigation below 800px. Respect reduced motion, labeled fields, keyboard navigation, focus restoration and dialog dismissal.

Visible first-screen copy: meal points; Overview; Activity; Your plan; A little planning. More good meals.; Saved on this device; Your everyday, a little easier.; Good meals. Great balance.; Make the most of your meal plan, one meal at a time.; Edit plan; Points remaining; 0.00 pts; Set up your plan to start tracking.; Starting balance; Spent so far; Your daily allowance; — pts; A small guide for the days ahead.; Set a plan end date to see your budget.; Log a meal; Where did you eat?; e.g. Campus café; Points spent; Meal; Date; Add meal; Recent activity; View all; All meals; Breakfast; Lunch; Dinner; Snack; Your first meal starts here; Log a meal and we’ll keep track of the points.; Your pace, your plan.; Points stay on this browser. No account needed.

Additional functional states use this same system: plan dialog, validation errors, real activity rows with delete/undo, all-activity search/export, empty filters, expiration and overspending messages. Date input defaults to local today rather than the concept placeholder for easier use. Icons use Lucide outlines; simple utensil wordmark and bowl empty state. No raster assets required in production.

## Data and behavior

Store points as integer hundredths. Accept positive decimal input up to 999999.99 and two decimal places; reject zero, negative, nonfinite, exponent and overprecision values. Dates are real YYYY-MM-DD calendar dates. Remaining days include today and use calendar arithmetic resistant to DST. Expired or overdrawn plans have zero daily allowance. Overspending stays visible with a negative balance rather than silently clamping. Daily allowance rounds down to avoid exceeding the available points. Saving a revised plan retains meals. Delete supports undo. Handle unavailable or corrupt storage with visible messages and preserve invalid bytes until an explicit recovery/reset action. No automatic overwrite on initial render. CSV quotes user fields and neutralizes formulas. Test real UI behavior and persisted data, not implementation text.

## Review corrections

Persist mutations under a browser Web Lock after reading the latest saved state; block saving if the read fails. Keep plan editor drafts intact when another tab updates storage. Saving requires a modern browser and a secure origin (HTTPS or localhost). These corrections protect existing history rather than adding product scope.
