import { useCallback, useRef, useMemo, useImperativeHandle, forwardRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS } from '../lib/types';
import { PericopeChunk, type PericopeChunkData } from './PericopeChunk';
import type { Theme } from '../lib/theme';

export interface VerseGridHandle {
  scrollToRow: (rowId: number) => void;
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
  const onScrollParentRef = useCallback((el: HTMLDivElement | null) => setScrollParent(el), []);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAutoScrolling = useRef(false);
  const autoScrollClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      let min = Infinity;
      let max = -Infinity;
      set.forEach(id => {
        if (id < min) min = id;
        if (id > max) max = id;
      });
      setVisibleRangeRef.current(min, max);
    });
  }, []);

  const observeCell = useCallback((el: HTMLElement | null) => {
    if (!el) return;
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
          if (isAutoScrolling.current) return;
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
        visibleRowsRef.current.delete(id);
        rangeVisibleRef.current.delete(id);
        flushVisibleRange();
      }
    };
  }, [flushVisibleRange]);

  // Two-step scrollToRow: virtuoso jumps to the containing chunk, then we land precisely on the row.
  useImperativeHandle(
    ref,
    () => ({
      scrollToRow: (rowId: number) => {
        const container = scrollParent;
        if (!container) return;
        const chunkIndex = pericopeChunks.findIndex(c =>
          c.rows.some(r => r.id === rowId)
        );
        if (chunkIndex < 0) return;

        isAutoScrolling.current = true;
        if (autoScrollClearTimer.current) clearTimeout(autoScrollClearTimer.current);
        setCurrentRowId(rowId);

        virtuosoRef.current?.scrollToIndex({
          index: chunkIndex,
          behavior: 'auto',
          align: 'start',
        });

        const doFinalScroll = () => {
          const el = container.querySelector(`[data-row-id="${rowId}"]`);
          if (!el) return false;
          const elRect = el.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const targetTop = elRect.top - containerRect.top + container.scrollTop - 8;
          container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          return true;
        };

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!doFinalScroll()) {
              setTimeout(doFinalScroll, 80);
            }
          });
        });

        autoScrollClearTimer.current = setTimeout(() => {
          isAutoScrolling.current = false;
        }, 800);
      },
    }),
    [scrollParent, pericopeChunks, setCurrentRowId]
  );

  return (
    <div
      ref={onScrollParentRef}
      data-grid-scroller=""
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth',
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
            if (isAutoScrolling.current) return;
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
