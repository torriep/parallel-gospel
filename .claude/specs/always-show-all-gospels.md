# Always show all four gospels

## What we're building
Remove the per-column hide/show toggle. All four gospels are always visible. Drop the "Masqué" strip and any visibility state.

## Why
Pierre saw a gospel masked and doesn't want any hiding. The app's whole purpose is parallel reading of all four — hiding a column contradicts the goal.

## Product concepts touched
Column headers, app store visibility state, the column-visibility toggle button.

## Key decisions
1. **Remove the visibility toggle** on each gospel column header (the eye-show/eye-off icon, or whatever icon currently sits next to the gospel name).
2. **Remove the "Masqué: + Marc" indicator strip** that renders below the column headers when any column is hidden.
3. **Delete the `visibleColumns` state and `toggleColumn` action** from `appStore.ts`. Wherever code reads `visibleColumns`, just treat all four as `true`.
4. **In `VerseGrid.tsx` and `ColumnHeaders.tsx`**, replace any `visibleColumns`-based filter with the constant list of all four `GOSPEL_KEYS`. The grid always renders 4 columns.
5. **Drop any persisted preference** for hidden columns in localStorage / dexie if one exists. Migration: just ignore the old value.

## Out of scope
- Don't touch anything else about the column headers (gospel names, verse pickers, tap-to-jump).
- Don't change the FocusCard's "absent" treatment — that's about a gospel having no parallel for a specific row, not about hiding columns.
