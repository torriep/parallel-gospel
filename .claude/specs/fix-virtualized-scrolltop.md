# Fix verse selection lands at top with virtualization

## What we're building
Make `scrollToRow` reliably land the target row at the top of the visible grid, even with Virtuoso virtualization. The current two-step implementation races: Virtuoso's smooth `scrollToIndex` is still in progress when the second container.scrollTo fires, so the math uses an intermediate scroll position.

## Why
Pierre selects a verse from the picker or a pericope from the sidebar; the row appears in the grid but not at the top. Same for chapter switches inside the picker. The chunk gets scrolled to, but the precise per-row land step never wins.

## Product concepts touched
`scrollToRow` in `VerseGrid.tsx`.

## Key decisions

1. **Step 1 — instant chunk scroll, not smooth.** Change:
   ```typescript
   virtuosoRef.current?.scrollToIndex({ index: chunkIndex, align: 'start', behavior: 'smooth' });
   ```
   to:
   ```typescript
   virtuosoRef.current?.scrollToIndex({ index: chunkIndex, align: 'start', behavior: 'auto' });
   ```
   `behavior: 'auto'` is instant — the chunk mounts and the scroll position jumps to the chunk's top. No animation in flight to fight with step 2.

2. **Step 2 — wait for DOM, then smooth-scroll precisely.** Replace the `setTimeout(250)` with a double `requestAnimationFrame` + retry pattern:
   ```typescript
   const doFinalScroll = () => {
     const el = scrollParentRef.current?.querySelector(`[data-row-id="${rowId}"]`);
     if (!el || !scrollParentRef.current) return false;
     const elRect = el.getBoundingClientRect();
     const containerRect = scrollParentRef.current.getBoundingClientRect();
     const targetTop = elRect.top - containerRect.top + scrollParentRef.current.scrollTop - 8;
     scrollParentRef.current.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
     return true;
   };
   
   requestAnimationFrame(() => {
     requestAnimationFrame(() => {
       if (!doFinalScroll()) {
         // Chunk not mounted yet — retry once more after Virtuoso finishes mounting
         setTimeout(doFinalScroll, 80);
       }
     });
   });
   ```

3. **Keep `isAutoScrolling` suppression** as-is, ~800ms duration.

4. **Don't change anything else** — section headers, span layout, IntersectionObserver scrollspy, picker UI, sidebar — all untouched.

## Out of scope
- Don't change Virtuoso's overscan, defaultItemHeight, or other tuning.
- Don't change FocusCard, SearchPanel, Sidebar.
- No new dependencies.
