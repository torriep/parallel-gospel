# Make scroll-to-row land verses at the top deterministically

## What we're building
Replace the `scrollIntoView({ block: 'start' })` call in `VerseGrid.tsx::scrollToRow` with a manual `container.scrollTo({ top: offset, behavior: 'smooth' })` computation. Same effect on paper, no browser quirks with `scrollMarginTop`, `scrollIntoView` heuristics, or grid-span weirdness.

## Why
Pierre tested live: when he picks LC 6:7 from the verse picker, the verse lands at the bottom of the visible area instead of the top. The current code uses `scrollIntoView({ block: 'start' })` which *should* work but evidently doesn't on iPad in some cases. Computing the scroll math ourselves removes the ambiguity.

## Product concepts touched
Pericope sidebar nav, verse picker nav, any future programmatic scroll.

## Key decisions
1. **In `VerseGrid.tsx`, in `scrollToRow`:** replace the `el.scrollIntoView(...)` line with:
   ```typescript
   const containerRect = container.getBoundingClientRect();
   const elRect = el.getBoundingClientRect();
   const targetTop = elRect.top - containerRect.top + container.scrollTop - 8; // 8px breathing room
   container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
   ```
2. **Remove the `scrollMarginTop` style from the row cells** (lines 148 of VerseGrid.tsx). It's no longer needed — the breathing room is now in the `targetTop - 8` calculation, applied consistently regardless of section-header presence.
3. **Keep everything else** in `scrollToRow` as is — the `isAutoScrolling` ref, the `setCurrentRowId(rowId)` commit, the 600ms suspension timeout.
4. **Verify after applying:** tap LC 6:7 from the verse picker; LC 6:7 should be at the very top of the visible grid area (right under the column headers, with a hair of breathing room). Same for sidebar pericope taps.

## Out of scope
- Don't change anything in `VersePicker.tsx` or `App.tsx`.
- Don't touch the scrollspy logic.
