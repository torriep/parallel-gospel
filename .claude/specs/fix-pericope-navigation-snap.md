# Fix pericope navigation snap

## What we're building
Fix the bug where tapping a pericope in the sidebar briefly highlights it, then the highlight jumps back to the previous pericope because the previous one is still visible at the top of the screen.

## Why
The reader explicitly chose pericope X. The app currently scrolls X to the middle, which leaves X-1 visible at the top of the viewport. Scrollspy then sees X-1 and snaps the sidebar highlight back to X-1. The reader's intent is overridden by the scroll-position heuristic.

## Product concepts touched
Pericope navigation, scrollspy / current-row tracking, sidebar highlight.

## User journeys affected
- Tapping a pericope in the sidebar
- Selecting a verse in the gospel column picker (same scroll path, same bug)

## Key decisions
1. **In `VerseGrid.tsx`, change** `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` to `block: 'start'`. The selected row lands at the top of the visible area. Optionally add `scrollMarginTop` of ~16px on row containers so the section header has a hair of breathing room.
2. **Suspend the scrollspy on explicit navigation.** Add an `isAutoScrolling` ref. In `scrollToRow`, set it to `true`, then set a timeout (~600ms) to clear it. In the `handleScroll` callback, early-return while `isAutoScrolling` is true. This prevents the highlight from chasing intermediate scroll positions during smooth-scrolling.
3. **No change to scrollspy's manual-scroll behavior** — when the user scrolls with their finger, the highlight should still follow normally. Only programmatic scrolls suspend it.

## Out of scope
- Don't redesign the sidebar or pericope panel
- Don't touch what the highlight looks like — only when it updates
