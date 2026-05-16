# Fix sidebar active-pericope highlight lagging scroll

## What we're building
Track the currently-displayed pericope via Virtuoso's `rangeChanged` (or `atTopThresholdChanged` / `itemsRendered`) callback — Virtuoso always knows which chunks are mounted. Stop relying on the per-cell IntersectionObserver as the authoritative source for `currentRowId`.

## Why
Pierre sees the sidebar highlighting "Jésus à douze ans au Temple" (last Naissance pericope, row ~193) while actually reading content in the Ministère phase (rows ~480-500). The per-cell IntersectionObserver gets stuck on unmounted cells — when Virtuoso unmounts a chunk on scroll-past, its cells silently leave the observer (no "left viewport" event fires), so `currentRowId` stops updating. This happens at every pericope boundary on fast scroll.

## Product concepts touched
VerseGrid scrollspy, sidebar active highlight.

## Key decisions

1. **In `VerseGrid.tsx`**, add a `rangeChanged` handler on `<Virtuoso>`:
   ```tsx
   <Virtuoso
     data={pericopeChunks}
     itemContent={...}
     rangeChanged={(range) => {
       if (isAutoScrolling.current) return;
       const topChunk = pericopeChunks[range.startIndex];
       if (!topChunk) return;
       const firstRowId = topChunk.rows[0]?.id;
       if (firstRowId != null) setCurrentRowId(firstRowId);
     }}
     ...
   />
   ```
   This sets `currentRowId` to the first row of the topmost visible chunk on every range change. Authoritative.

2. **Keep the IntersectionObserver-based scrollspy** for within-chunk granularity (which row inside the visible chunk is closest to the top), so the column-header verse references update as you scroll. But the IntersectionObserver should only refine `currentRowId` WITHIN the topmost mounted chunk — if it tries to set a row from a different chunk, ignore it.

3. **Suspension still holds** — both mechanisms respect `isAutoScrolling.current` and skip updates during programmatic scrolls.

4. **No change to `scrollToRow`** — its existing two-step logic (`scrollToIndex` with `behavior: 'auto'` then `scrollTo` + double rAF) stays as-is.

## Verification after implementation
- Scroll rapidly from the top of the gospel through several pericope boundaries. The sidebar highlight should track within ~1 pericope of the visible content, not lag dozens of pericopes behind.
- Tap a pericope in the sidebar — it should still highlight correctly right away (via `scrollToRow`'s eager `setCurrentRowId`).
- Tap a verse in the picker — same.

## Out of scope
- Don't change Virtuoso's overscan or other tuning.
- Don't change FocusCard, picker, sidebar layout, search.
