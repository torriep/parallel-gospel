# Inline section headers for absorbed pericopes

## What we're building
When a pericope gets absorbed into a previous chunk (because of verse-span overflow at the boundary), still render its section header — but as a smaller inline header inside the parent chunk's grid at the absorbed pericope's startRow position. Every pericope keeps a visible heading in the reading area. Spans stay intact.

## Why
Pierre's data has `LC 5:1` with span 2, which overflows into row 447 — the start of "Appel des premiers disciples". The current chunking algorithm "absorbs" Appel into Pêche miraculeuse's chunk, and Appel's section header silently disappears from the reading area. The sidebar still lists Appel, but readers scrolling through the verse grid see Pêche → Lépreux with no header in between, even though calling-of-disciples content sits between them. This happens at every span/pericope boundary collision (likely a handful across the gospel).

## Product concepts touched
Pericope chunking, section headers, sidebar active-pericope tracking.

## Key decisions

1. **Track absorbed pericopes per chunk.** In `VerseGrid.tsx::pericopeChunks`, when a pericope gets absorbed (the `nextPi++` in the absorption loop), instead of throwing it away, record it on the current chunk. Update `PericopeChunkData`:
   ```typescript
   export type PericopeChunkData = {
     pericope: Pericope & { startRow: number };
     rows: GospelRow[];
     subPericopes: Array<Pericope & { startRow: number }>;  // absorbed ones, in row order
   };
   ```

2. **Pass `subPericopes` to `PericopeChunk`.** In `PericopeChunk.tsx`, when rendering the grid, before each row check if any subPericope has `startRow === row.id`. If yes, render a full-width inline header above that row's cells. The inline header is a single `<div style="gridColumn: 1 / -1">` containing a smaller styled section header.

3. **Visual style for inline headers** — smaller, more subtle than the chunk's main header:
   - Same font family, but `fontSize: 0.75em` (vs 0.85em for the main header)
   - `letterSpacing: 1.5` (vs 2)
   - Add thin top + bottom hairlines (`borderTop`, `borderBottom: 1px solid theme.borderLight`)
   - Background: subtle warm tint, e.g. `rgba(245, 230, 200, 0.25)` in light mode, `rgba(60, 50, 35, 0.4)` in dark mode
   - Vertical padding: 6px (vs 10px for the main header)
   - Center-aligned, uppercase, muted color

4. **Sidebar active tracking should still work** — the `IntersectionObserver`-based `setCurrentRowId` handles within-chunk granularity, and the sidebar's `isActive = p.startRow <= currentRowId && nextP.startRow > currentRowId` will correctly highlight the absorbed pericope when the reader's current row is in its range. **BUT** the `rangeChanged` callback currently overrides `currentRowId` to the topmost chunk's first row on every Virtuoso range change — that resets the highlight to the parent pericope. Change `rangeChanged` so it only sets `currentRowId` if the current value is NOT already within the topmost chunk's row range. That way the per-cell observer's finer-grained updates aren't overwritten when staying inside the same chunk.

5. **No change to span rendering.** The verse cells with `gridRow: span N` keep working because the inline header is rendered as a full-width grid item OUTSIDE the spanning column — it pushes subsequent rows down by one grid row, but the existing spans (which use `span N` not absolute placement) flex with that.

6. **Edge case** — if a sub-pericope's startRow doesn't exist in the chunk's `rows` array (shouldn't happen after absorption, but defensive coding), skip the inline header for that one and `console.warn`.

## Verification after implementation
1. Scroll into the early-Galilee region. Between "Pêche miraculeuse" and "Guérison du lépreux", you should now see an "Appel des premiers disciples" inline header at the right row.
2. Scroll continues to feel smooth.
3. The visual span where MT 4:18 covers multiple LC rows still works.
4. Sidebar highlight tracks correctly — when scrolling through Pêche content, "Pêche miraculeuse" is highlighted; when scrolling through Appel content, "Appel des premiers disciples" is highlighted.

## Out of scope
- Don't change FocusCard, search, picker.
- Don't change pericopes.json data.
- Don't change Virtuoso's overscan or other tuning.
