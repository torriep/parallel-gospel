# Speed up scrolling

## What we're building
Reduce scroll lag on iPad by (a) letting the browser skip rendering off-screen verse cells via `content-visibility: auto`, and (b) replacing the per-scroll-event `querySelectorAll` in the scrollspy with an `IntersectionObserver`.

## Why
Pierre reports scrolling is slow on iPad. The grid renders all 2,753 rows × 4 columns = ~11k cells at mount and the scrollspy iterates `querySelectorAll('[data-row-id]')` on every scroll event. Both are expensive on mobile Safari. These two changes are cheap, don't touch the multi-row span layout, and should produce a noticeable improvement.

## Product concepts touched
VerseGrid rendering and current-row tracking.

## Key decisions
1. **In `VerseGrid.tsx`**, on each rendered row cell (the `<div data-row-id={row.id} ...>`), add the CSS:
   ```
   contentVisibility: 'auto',
   containIntrinsicSize: 'auto 80px',  // approximate row height, lets the browser reserve space for off-screen rows
   ```
   This lets WebKit/Blink skip layout + paint for off-screen cells. Modern Safari (iPad iOS 16+) supports this.

2. **Replace the scrollspy in `VerseGrid.tsx`**. Currently `handleScroll` calls `container.querySelectorAll('[data-row-id]')` and iterates all 11k cells on every frame. Swap it for an `IntersectionObserver` that watches each row cell and tracks which row is currently topmost in the viewport. Use a `rootMargin` of `-100px 0px -90% 0px` so it triggers when a row enters the top ~10% of the viewport. Update `currentRowId` from the observer callback.
   - Skip the observer update while `isAutoScrolling.current` is true (preserve the existing programmatic-scroll suppression).
   - Disconnect/reconnect cleanly on unmount.

3. **Keep the multi-row span layout as-is.** Don't switch to react-window or any list virtualization — that would break `gridRow: span N` cross-row alignment.

4. **Don't change anything else.** Cell rendering, FocusCard, picker, search — all untouched.

## Out of scope
- Full virtualization. We're keeping the flat CSS grid because spans depend on it.
- Reducing the per-cell borderBottom. Visual change, not a perf priority right now.
- React.memo / memoization tuning on VerseCell. Try the two changes above first.
