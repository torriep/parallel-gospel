import { useCallback, useRef, useMemo, useImperativeHandle, forwardRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS } from '../lib/types';
import { PericopeChunk, type PericopeChunkData } from './PericopeChunk';
import type { Theme } from '../lib/theme';

export interface VerseGridHandle {
  scrollToRow: (rowId: number, opts?: { instant?: boolean }) => void;
}

interface VerseGridProps {
  theme: Theme;
  onRowTap: (rowId: number) => void;
  onRowLongPress: (rowId: number) => void;
}

export const VerseGrid = forwardRef<VerseGridHandle, VerseGridProps>(function VerseGrid(
  { theme, onRowTap, onRowLongPress },
  ref
) {
  const rows = useDataStore(s => s.rows);
  const pericopes = useDataStore(s => s.pericopes);
  const highlightedRowId = useAppStore(s => s.highlightedRowId);
  const setCurrentRowId = useAppStore(s => s.setCurrentRowId);
  const setVisibleRange = useAppStore(s => s.setVisibleRange);

  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
  const onScrollParentRef = useCallback((el: HTMLDivElement | null) => {
    scrollParentRef.current = el;
    setScrollParent(el);
  }, []);

  const virtuosoRef = useRef<VirtuosoHandle>(null);

  // ---- Programmatic-scroll lifecycle ---------------------------------------
  // ONE source of truth: appStore.isAutoScrolling. It is true from the moment
  // a programmatic scroll starts until the target row is VERIFIED to have
  // landed (instant scrolls — deterministic convergence loop below) or scroll
  // events have stopped (smooth scrolls — settle debounce). The scroll-spy,
  // rangeChanged and the x-ray pin all key off this single flag. The previous
  // design had a SECOND, parallel gate (a local ref cleared by a fixed 800ms
  // timer) that could disagree with the flag mid-flight — removed.
  const landingRef = useRef<(() => void) | null>(null); // cancels the active landing loop
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxAutoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endAutoScroll = useCallback(() => {
    if (landingRef.current) { landingRef.current(); landingRef.current = null; }
    if (settleTimerRef.current) { clearTimeout(settleTimerRef.current); settleTimerRef.current = null; }
    if (maxAutoTimerRef.current) { clearTimeout(maxAutoTimerRef.current); maxAutoTimerRef.current = null; }
    useAppStore.getState().setAutoScrolling(false);
  }, []);

  // Smooth scrolls only: re-armed on every scroll event; fires when they stop.
  // Instant scrolls end their own lifecycle (the landing loop knows when it
  // has truly landed), so the debounce defers to an active loop.
  const scheduleSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      if (landingRef.current) return;
      endAutoScroll();
    }, 150);
  }, [endAutoScroll]);

  // Build pericope chunks with span-overflow safety.
  // Each chunk = [sectionHeader, rows from pericope.startRow up to next.startRow-1],
  // extended forward if any verse.span would reach past the boundary.
  const pericopeChunks = useMemo<PericopeChunkData[]>(() => {
    if (rows.length === 0 || pericopes.length === 0) return [];
    const rowIndexById = new Map<number, number>();
    for (let i = 0; i < rows.length; i++) rowIndexById.set(rows[i].id, i);
    const sorted = [...pericopes].sort((a, b) => a.startRow - b.startRow);
    const chunks: PericopeChunkData[] = [];

    let pi = 0;
    while (pi < sorted.length) {
      const peri = sorted[pi];
      const startIdx = rowIndexById.get(peri.startRow) ?? 0;
      const subPericopes: Array<(typeof sorted)[number]> = [];
      let nextPi = pi + 1;
      const ceilingFor = (idx: number) =>
        idx < sorted.length
          ? (rowIndexById.get(sorted[idx].startRow) ?? rows.length) - 1
          : rows.length - 1;
      let endIdx = ceilingFor(nextPi);

      let changed = true;
      while (changed) {
        changed = false;
        // Extend endIdx for any span that would reach past it
        for (let i = startIdx; i <= endIdx && i < rows.length; i++) {
          const r = rows[i];
          for (const k of GOSPEL_KEYS) {
            const span = r[k]?.span ?? 1;
            if (span > 1 && i + span - 1 > endIdx) {
              endIdx = i + span - 1;
              changed = true;
            }
          }
        }
        // Absorb any pericopes whose start row now falls inside the extended range
        while (
          nextPi < sorted.length &&
          (rowIndexById.get(sorted[nextPi].startRow) ?? Infinity) <= endIdx
        ) {
          // eslint-disable-next-line no-console
          console.warn(
            `Span overflow: pericope "${sorted[nextPi].label.fr}" absorbed into "${peri.label.fr}"`
          );
          subPericopes.push(sorted[nextPi]);
          nextPi++;
          changed = true;
        }
        // Pull endIdx forward to cover all rows belonging to absorbed pericopes
        const newCeiling = ceilingFor(nextPi);
        if (newCeiling > endIdx) {
          endIdx = newCeiling;
          changed = true;
        }
      }

      if (endIdx >= rows.length) endIdx = rows.length - 1;
      chunks.push({
        pericope: peri,
        rows: rows.slice(startIdx, endIdx + 1),
        subPericopes,
      });
      pi = nextPi;
    }
    return chunks;
  }, [rows, pericopes]);

  // Row id → chunk index lookup for the IntersectionObserver guard.
  const rowToChunkIndex = useMemo(() => {
    const map = new Map<number, number>();
    pericopeChunks.forEach((chunk, idx) => {
      for (const r of chunk.rows) map.set(r.id, idx);
    });
    return map;
  }, [pericopeChunks]);

  // IntersectionObserver scrollspy. Lazy-initialized when the first cell registers
  // (so we can pick up the scrollParent via DOM traversal without an effect race).
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleRowsRef = useRef<Set<number>>(new Set());
  const topChunkIndexRef = useRef<number>(0);
  const rowToChunkIndexRef = useRef(rowToChunkIndex);
  rowToChunkIndexRef.current = rowToChunkIndex;
  const setCurrentRowIdRef = useRef(setCurrentRowId);
  setCurrentRowIdRef.current = setCurrentRowId;

  // Separate, full-viewport observer that tracks EVERY row currently on screen
  // (not just the top sliver the scroll-spy uses). Its min/max drive the
  // GospelXray "you-are-here" band, so the band always covers exactly what is
  // visible — independent of the laggier currentRowId scroll-spy.
  const rangeObserverRef = useRef<IntersectionObserver | null>(null);
  const rangeVisibleRef = useRef<Set<number>>(new Set());
  // Live registry of mounted cells per row id, so the flush below can read
  // their positions without DOM queries.
  const cellsByIdRef = useRef<Map<number, Set<HTMLElement>>>(new Map());
  const setVisibleRangeRef = useRef(setVisibleRange);
  setVisibleRangeRef.current = setVisibleRange;
  const rangeFlushRaf = useRef<number | null>(null);
  const flushVisibleRange = useCallback(() => {
    if (rangeFlushRaf.current != null) return;
    rangeFlushRaf.current = requestAnimationFrame(() => {
      rangeFlushRaf.current = null;
      const set = rangeVisibleRef.current;
      if (set.size === 0) {
        setVisibleRangeRef.current(null, null);
        return;
      }
      // Reading position = the first row that BEGINS at/below the viewport
      // top, measured geometrically. "Lowest intersecting row id" is WRONG
      // here: a row-spanning cell (up to 47 rows long in this data!) that
      // started far above still touches the viewport top, dragging the
      // reported position — and the x-ray band — up to ~25px upward after a
      // landing. Spans now count only where they begin, not everywhere they
      // reach.
      const containerTop = scrollParentRef.current?.getBoundingClientRect().top;
      let minAny = Infinity;
      let max = -Infinity;
      let boundaryId: number | null = null;
      let boundaryTop = Infinity;
      set.forEach(id => {
        if (id < minAny) minAny = id;
        if (id > max) max = id;
        if (containerTop !== undefined) {
          const cells = cellsByIdRef.current.get(id);
          const el: HTMLElement | undefined = cells?.values().next().value;
          if (el) {
            const top = el.getBoundingClientRect().top;
            // -12 tolerance: landings place the row's top 8px below the
            // container top; rows a few px past the edge still count as "at
            // the top".
            if (top >= containerTop - 12 && top < boundaryTop) {
              boundaryTop = top;
              boundaryId = id;
            }
          }
        }
      });
      setVisibleRangeRef.current(
        boundaryId ?? (minAny === Infinity ? null : minAny),
        max === -Infinity ? null : max
      );
    });
  }, []);

  const observeCell = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    {
      const id = parseInt(el.dataset.rowId ?? '', 10);
      if (!isNaN(id)) {
        let cells = cellsByIdRef.current.get(id);
        if (!cells) cellsByIdRef.current.set(id, (cells = new Set()));
        cells.add(el);
      }
    }
    if (!rangeObserverRef.current) {
      const root =
        (el.closest('[data-grid-scroller]') as HTMLElement | null) ?? null;
      if (root) {
        rangeObserverRef.current = new IntersectionObserver(
          entries => {
            for (const entry of entries) {
              const id = parseInt((entry.target as HTMLElement).dataset.rowId ?? '', 10);
              if (isNaN(id)) continue;
              if (entry.isIntersecting) rangeVisibleRef.current.add(id);
              else rangeVisibleRef.current.delete(id);
            }
            flushVisibleRange();
          },
          { root, threshold: 0 }
        );
      }
    }
    rangeObserverRef.current?.observe(el);
    if (!observerRef.current) {
      const root =
        (el.closest('[data-grid-scroller]') as HTMLElement | null) ?? null;
      if (!root) return;
      observerRef.current = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const id = parseInt((entry.target as HTMLElement).dataset.rowId ?? '', 10);
            if (isNaN(id)) continue;
            if (entry.isIntersecting) visibleRowsRef.current.add(id);
            else visibleRowsRef.current.delete(id);
          }
          if (useAppStore.getState().isAutoScrolling) return;
          if (visibleRowsRef.current.size === 0) return;
          let minId = Infinity;
          visibleRowsRef.current.forEach(id => {
            if (id < minId) minId = id;
          });
          if (minId === Infinity) return;
          // Only refine currentRowId within the topmost mounted chunk —
          // stale cells from unmounted chunks shouldn't drive the highlight.
          if (rowToChunkIndexRef.current.get(minId) !== topChunkIndexRef.current) return;
          setCurrentRowIdRef.current(minId);
        },
        { root, rootMargin: '-100px 0px -90% 0px', threshold: 0 }
      );
    }
    observerRef.current.observe(el);
    return () => {
      observerRef.current?.unobserve(el);
      rangeObserverRef.current?.unobserve(el);
      const id = parseInt(el.dataset.rowId ?? '', 10);
      if (!isNaN(id)) {
        const cells = cellsByIdRef.current.get(id);
        cells?.delete(el);
        if (cells && cells.size === 0) {
          cellsByIdRef.current.delete(id);
          visibleRowsRef.current.delete(id);
          rangeVisibleRef.current.delete(id);
        }
        flushVisibleRange();
      }
    };
  }, [flushVisibleRange]);

  // Two-step scrollToRow: virtuoso jumps to the containing chunk, then we land
  // precisely on the row. The previous version attempted the precise landing
  // ONCE (+1 retry at 80ms) and never verified it — if the chunk hadn't
  // mounted yet, or virtuoso re-measured and shifted content afterwards, the
  // viewport quietly ended up somewhere ABOVE the target (that was the
  // "rectangle moves up after tapping" bug). Instant landings now CONVERGE:
  // re-check every frame, correct, and only declare done after the row has
  // held the top position for 3 consecutive frames.
  useImperativeHandle(
    ref,
    () => ({
      scrollToRow: (rowId: number, opts?: { instant?: boolean }) => {
        const container = scrollParent;
        if (!container) return;
        const instant = !!opts?.instant;
        const chunkIndex = pericopeChunks.findIndex(c =>
          c.rows.some(r => r.id === rowId)
        );
        if (chunkIndex < 0) return;

        // A new command supersedes any landing still in progress.
        endAutoScroll();
        useAppStore.getState().setAutoScrolling(true);
        setCurrentRowId(rowId);

        // Absolute safety cap — landings normally end themselves well before.
        maxAutoTimerRef.current = setTimeout(endAutoScroll, 4500);

        // Step 1: virtuoso mounts/jumps to the containing chunk.
        virtuosoRef.current?.scrollToIndex({
          index: chunkIndex,
          behavior: 'auto',
          align: 'start',
        });

        // Signed distance (px) between the row's top and where it should land
        // (8px below the container top, as before).
        const offsetOf = (el: Element) =>
          el.getBoundingClientRect().top - container.getBoundingClientRect().top - 8;

        if (instant) {
          // Step 2 (instant — x-ray taps): ONE scroll driver, virtuoso itself.
          // After scrollToIndex, virtuoso runs its own multi-frame correction
          // cycle (it re-scrolls as unmeasured chunks get their real heights —
          // strongest on the FIRST visit to a region). An earlier version
          // scrolled the container directly in parallel, so two drivers fought
          // over scrollTop toward two different targets and the landing ended
          // anywhere ("rectangle jumps way up or way down"; fine on revisits
          // because nothing re-measures). Now: once the target cell mounts, we
          // compute its pixel offset INSIDE its chunk and re-issue
          // scrollToIndex with that offset — virtuoso then keeps the row
          // aligned through every one of its own re-measures. We only watch,
          // and only nudge when the scroller has been provably idle.
          let cancelled = false;
          let raf = 0;
          let offsetIssued = false;
          let lastScrollTop = -1;
          let stillFrames = 0;
          let corrections = 0;
          let approaches = 0;
          const onUserInput = () => endAutoScroll();
          container.addEventListener('touchstart', onUserInput, { passive: true });
          container.addEventListener('wheel', onUserInput, { passive: true });
          landingRef.current = () => {
            cancelled = true;
            cancelAnimationFrame(raf);
            container.removeEventListener('touchstart', onUserInput);
            container.removeEventListener('wheel', onUserInput);
          };
          // Dev-only landing trace (inspect window.__landingDebug in the console).
          const dbg: Array<Record<string, unknown>> = [];
          const t0 = performance.now();
          if (import.meta.env.DEV) {
            (window as unknown as Record<string, unknown>).__landingDebug = { rowId, chunkIndex, events: dbg };
          }
          const trace = (phase: string, extra?: Record<string, unknown>) => {
            if (import.meta.env.DEV) dbg.push({ t: Math.round(performance.now() - t0), phase, scrollTop: Math.round(container.scrollTop), ...extra });
          };
          trace('start');

          const deadline = performance.now() + 4000;
          const step = () => {
            if (cancelled) return;
            if (performance.now() > deadline) { trace('deadline-giveup'); endAutoScroll(); return; }

            const el = container.querySelector(`[data-row-id="${rowId}"]`);
            if (el && !offsetIssued) {
              const item = el.closest('[data-index]');
              if (item) {
                offsetIssued = true;
                const offset = Math.round(
                  el.getBoundingClientRect().top - item.getBoundingClientRect().top
                ) - 8;
                trace('offset-issued', { offset, delta: Math.round(offsetOf(el)) });
                virtuosoRef.current?.scrollToIndex({
                  index: chunkIndex,
                  behavior: 'auto',
                  align: 'start',
                  offset,
                });
                stillFrames = 0;
                lastScrollTop = -1;
              }
            }

            // Watch for stillness: scrollTop unchanged for 3 consecutive
            // frames means virtuoso's correction cycle is idle right now.
            const st = container.scrollTop;
            stillFrames = st === lastScrollTop ? stillFrames + 1 : 0;
            lastScrollTop = st;

            // RECOVERY: the layout can slide by thousands of px when estimated
            // chunks above get their real heights AFTER our jump (mega-chunks
            // from span absorption make this violent on first visits). If that
            // shift carried the viewport away, the target chunk unmounts and
            // the cell disappears — so once the scroller is provably idle with
            // no cell in sight, we re-approach: jump to the chunk again (each
            // pass benefits from the measurements the previous one caused),
            // then re-offset and re-verify.
            if (!el && stillFrames >= 3) {
              if (approaches < 4) {
                approaches += 1;
                offsetIssued = false;
                trace('re-approach', { approaches });
                virtuosoRef.current?.scrollToIndex({ index: chunkIndex, behavior: 'auto', align: 'start' });
                stillFrames = 0;
                lastScrollTop = -1;
              } else {
                trace('giveup-no-cell');
                endAutoScroll();
                return;
              }
            }

            if (offsetIssued && el && stillFrames >= 3) {
              const delta = offsetOf(el);
              if (Math.abs(delta) <= 1) { trace('landed', { delta: Math.round(delta) }); endAutoScroll(); return; }
              trace('still-but-off', { delta: Math.round(delta), corrections });
              if (corrections < 5) {
                // Safe to nudge: the other driver is idle. Acting only during
                // proven stillness is what makes a fight impossible.
                corrections += 1;
                container.scrollTo({ top: Math.max(0, st + delta), behavior: 'auto' });
                if (container.scrollTop === st) {
                  // Clamped at an edge (tap near the very end of the book):
                  // the row can never reach the top — this is the best spot.
                  trace('clamped-done');
                  endAutoScroll();
                  return;
                }
                stillFrames = 0;
              } else {
                trace('corrections-exhausted');
                endAutoScroll();
                return;
              }
            }
            raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        } else {
          // Step 2 (smooth — sidebar/search/bookmarks): wait for the row's
          // cell to mount (every frame, up to 600ms — not a single 80ms shot),
          // then one smooth scroll; the settle debounce ends the lifecycle.
          scheduleSettle();
          const deadline = performance.now() + 600;
          const tryScroll = () => {
            const el = container.querySelector(`[data-row-id="${rowId}"]`);
            if (el) {
              container.scrollTo({
                top: Math.max(0, container.scrollTop + offsetOf(el)),
                behavior: 'smooth',
              });
              return;
            }
            if (performance.now() < deadline) requestAnimationFrame(tryScroll);
          };
          requestAnimationFrame(tryScroll);
        }
      },
    }),
    [scrollParent, pericopeChunks, setCurrentRowId, scheduleSettle, endAutoScroll]
  );

  return (
    <div
      ref={onScrollParentRef}
      data-grid-scroller=""
      onScroll={() => {
        // While an auto-scroll is in flight, each scroll event pushes the
        // "settled" moment later; when they stop, scheduleSettle fires.
        if (useAppStore.getState().isAutoScrolling) scheduleSettle();
        // Keep the geometric reading position fresh during the scroll itself —
        // the IntersectionObserver only fires when cells enter/leave, but the
        // boundary row changes continuously. rAF-throttled inside.
        flushVisibleRange();
      }}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        // NO CSS scroll-behavior:smooth here — it would animate EVERY
        // programmatic scrollTop change, including virtuoso's internal
        // re-measure corrections, making landings slow and drifty. Smooth
        // scrolling is requested explicitly per scrollTo() call instead.
      }}
    >
      {scrollParent && (
        <Virtuoso
          ref={virtuosoRef}
          data={pericopeChunks}
          customScrollParent={scrollParent}
          overscan={300}
          rangeChanged={range => {
            topChunkIndexRef.current = range.startIndex;
            if (useAppStore.getState().isAutoScrolling) return;
            const topChunk = pericopeChunks[range.startIndex];
            if (!topChunk) return;
            // If currentRowId is already within the topmost chunk, leave it —
            // the per-cell observer's finer-grained value (which can land on an
            // absorbed sub-pericope) shouldn't be reset to the parent's first row.
            const currentRowId = useAppStore.getState().currentRowId;
            if (rowToChunkIndexRef.current.get(currentRowId) === range.startIndex) return;
            const firstRowId = topChunk.rows[0]?.id;
            if (firstRowId != null) setCurrentRowId(firstRowId);
          }}
          itemContent={(_, chunk) => (
            <PericopeChunk
              chunk={chunk}
              theme={theme}
              highlightedRowId={highlightedRowId}
              onRowTap={onRowTap}
              onRowLongPress={onRowLongPress}
              observeCell={observeCell}
            />
          )}
          components={{
            Footer: () => (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: theme.textFaint,
                  fontSize: 13,
                  fontStyle: 'italic',
                }}
              >
                &#8942; {rows.length} versets alignés &#8942;
              </div>
            ),
          }}
        />
      )}
    </div>
  );
});
