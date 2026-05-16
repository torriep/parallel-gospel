# Unify search into a single entry

## What we're building
Make the top-bar 🔍 the single entry point for ALL search. Remove the duplicate "Rechercher péricope…" filter input from the sidebar. The SearchPanel now returns two grouped result sections: pericope matches and verse matches.

## Why
Pierre tested live: two search inputs in two places (sidebar + top bar) created confusion about what each does. Goodwin/Cooper goal-directed answer is one mental model, one entry point. Result list groups by type (péricope vs verset), readers see all matches in one place.

## Product concepts touched
SearchPanel, Sidebar, pericope navigation, verse navigation.

## Key decisions
1. **Remove** the search/filter `<input>` at the top of `Sidebar.tsx`. The sidebar becomes pure navigation: phase groups → pericope list, scroll only.
2. **Enhance `SearchPanel.tsx` to return two result sections:**
   - **Péricopes** — case-insensitive substring match on pericope labels. Show up to ~12. Each result line shows phase icon + label + small ref hint (e.g. `LC 4:1`).
   - **Versets** — existing full-text verse search behavior, capped at ~30 results.
3. **Query threshold:** start showing verse results at 3+ characters typed. Pericope results from 1 character (they're a short list — feels responsive).
4. **Result tap behavior:**
   - Pericope result → `onGoToRow(loc(pericope.startRef))` + close panel.
   - Verse result → `onGoToRow(rowId)` + close panel.
5. **Empty state:** when the input is empty, show a brief hint: `Cherchez une péricope ou un mot dans les versets.`
6. **Section headers** inside the panel use the existing small-uppercase muted style. No tabs, no segmented controls — one scrolling list with two labeled sections (Péricopes first, Versets below).
7. **Top-bar 🔍 button** opens SearchPanel as before. No change to the button.

## Out of scope
- Don't change SearchPanel's translation-switching or differences logic if any.
- Don't add fuzzy matching or autocomplete — substring match is enough for now.
- Don't change the FocusCard or VersePicker.
