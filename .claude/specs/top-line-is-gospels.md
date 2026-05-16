# Top line is the four gospels

## What we're building
Collapse the two top bands (TopBar + ColumnHeaders) into a single top line where the four gospel column headers ARE the chrome. No wordmark, no breadcrumb, no separate band of icons above.

## Why
The sidebar already tells the reader which pericope they're in — repeating that in a top breadcrumb is redundant. The app's identity belongs to the icon and splash, not a running wordmark. The four gospels are the working surface, so they belong at the top of the working surface. Goodwin/Cooper goal-directed thinking — every element earns its place.

## Product concepts touched
Top-level navigation chrome, column headers, settings popover.

## User journeys affected
- Opening the app — what they see first
- Tapping a gospel header to jump (unchanged behavior, just relocated)
- Configuring (translation, differences, dark mode, font size) — now all behind a single cog

## Key decisions
1. **Delete the TopBar wordmark and breadcrumb entirely.** The "Évangile Parallèle" text + cross icon + "Ministère › Belle-mère de Pierre" line are all removed.
2. **The four gospel headers become the top line.** Same VersePicker behavior (tap header → popover with chapter/verse grid, parallel sync on select).
3. **Layout:** `[☰ sidebar toggle | 44pt]  [ Matthieu ▾  Marc ▾  Luc ▾  Jean ▾ | flex ]  [🔍 search | 44pt]  [⚙ settings | 44pt]`
4. **Settings cog opens the SettingsPanel popover** (already exists). It hosts: differences toggle, dark mode, font size stepper, primary translation, secondary translation. The standalone Δ icon, moon/sun, translation button, font Aa button — all gone from the chrome.
5. **Search stays as its own icon** — it's a reader action, not configuration.
6. **Status bar at the bottom** (the 40pt one with progress + secondary controls) — keep as is for now. Out of scope.

## Out of scope
Sidebar, focus card, status bar, settings panel contents. Only the top chrome.
