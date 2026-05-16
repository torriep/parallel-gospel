# Virtualize by pericope (keep spans)

## What we're building
Replace the single flat CSS grid in `VerseGrid.tsx` with a virtualized list where each list item is a **pericope chunk** — that pericope's section header + all its rows — rendered as its own self-contained CSS grid. Spans within a pericope work exactly as today. Only 2-4 pericopes are mounted at any time.

## Why
Pierre needs scroll perf on iPad while keeping the visual spans where one tall verse cell aligns across multiple parallel verses. Pericope-level virtualization is the sweet spot: each pericope is small enough (~30 rows average) that its inner grid is cheap, and the outer list only mounts ~3 of them at a time. Spans live entirely within pericopes so they're preserved.

## Product concepts touched
Verse grid rendering, scrollToRow, scrollspy, the `pericopes` and `rows` data.

## Key decisions

1. **Add the dependency:** `npm i react-virtuoso`. It supports variable-height items and a `scrollToIndex` API we need.

2. **Build a `pericopeChunks` memo** from `rows` + `pericopes`:
   - For each pericope (sorted by row), the chunk spans `[pericope.startRow, nextPericope.startRow - 1]`.
   - Each chunk carries `{ pericope, rows: GospelRow[] }`.

3. **Span-crossing safety check.** Before chunking, scan the data for any row whose `verse.span` would extend past the next pericope's startRow. If found, **expand** the current chunk to include those overflowed rows and skip the next chunk's first rows accordingly. Log if this happens — should be rare or zero.

4. **Replace the single grid** in `VerseGrid.tsx` with `<Virtuoso>` from `react-virtuoso`:
   ```tsx
   <Virtuoso
     data={pericopeChunks}
     itemContent={(_, chunk) => <PericopeChunk chunk={chunk} ... />}
     ref={virtuosoRef}
     overscan={300}  // pixels — keep some neighboring chunks ready
   />
   ```

5. **`PericopeChunk` component** renders one pericope:
   - `<SectionHeader>` at the top
   - Below: the existing CSS grid (`display: grid; gridTemplateColumns: 1fr 1fr 1fr 1fr`) with that pericope's rows + spans + cells, exactly as before
   - Each row's first cell keeps `data-row-id={row.id}` for the existing scrollToRow + IntersectionObserver logic

6. **`scrollToRow` becomes two-step**:
   - Find which chunk contains `rowId` (`chunkIndex`).
   - Call `virtuosoRef.current?.scrollToIndex({ index: chunkIndex, behavior: 'smooth' })`.
   - Then in a `setTimeout(..., 250)` (give Virtuoso time to mount the chunk), find the row's DOM element and use the existing `container.scrollTo({ top: targetTop - 8 })` math to land the row at the top.
   - Keep `isAutoScrolling` suspension for the combined duration (extend timeout to ~800ms).

7. **IntersectionObserver scrollspy** still works — it just observes row cells in whatever chunks Virtuoso has mounted. When chunks unmount, observer auto-disconnects (cleanup in the effect).

8. **`contentVisibility` and `containIntrinsicSize` from the previous spec — remove them.** Virtualization replaces that strategy. Don't double up.

9. **Visual parity:** the rendered output must look identical to today. Spans inside a pericope behave exactly the same. Section header appears at the top of each chunk (unchanged from today).

## Edge cases to verify after implementation
- Tap a verse picker → land at top of correct row (covers `scrollToRow` path).
- Tap a pericope in sidebar → land at top of pericope.
- Scroll past 10+ pericopes — perf should feel night-and-day better than current.
- Highlight, bookmark, notes, FocusCard — all still work on visible rows.
- Pull to refresh (if applicable) — no scroll position oddities.

## Out of scope
- Don't change FocusCard, VersePicker, Sidebar, settings.
- Don't tune Virtuoso's `overscan` aggressively — start at 300 px, tune later if perf or pop-in is bad.
