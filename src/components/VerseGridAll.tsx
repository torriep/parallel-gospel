import { useCallback, useRef, useState, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS } from '../lib/types';
import { PericopeChunk, type PericopeChunkData } from './PericopeChunk';
import type { Theme } from '../lib/theme';
import type { VerseGridHandle } from './VerseGrid';

interface VerseGridAllProps {
  theme: Theme;
  onRowTap: (rowId: number) => void;
  onRowLongPress: (rowId: number) => void;
}

/**
 * EXPERIMENT (throwaway). Renders the ENTIRE harmony into the DOM at once and
 * lets the browser skip off-screen work via `content-visibility: auto`, instead
 * of virtualizing (mount/unmount) like the production VerseGrid. Purpose: feel
 * cold-load time, memory (node count) and scroll smoothness on a real iPad to
 * decide whether the simpler "everything is always in the DOM" model is viable.
 *
 * Wins it would buy: scrollToRow becomes a one-liner (the target always exists),
 * which deletes the whole convergence/landing machinery and x-ray drift bugs.
 * Costs it risks: building ~35k–115k nodes up front + steady-state memory.
 *
 * Kept deliberately simple — it mirrors enough of VerseGrid's scroll-spy to keep
 * the sidebar highlight and x-ray band working, nothing more.
 */
export const VerseGridAll = forwardRef<VerseGridHandle, VerseGridAllProps>(function VerseGridAll(
  { theme, onRowTap, onRowLongPress },
  ref
) {
  const rows = useDataStore(s => s.rows);
  const pericopes = useDataStore(s => s.pericopes);
  const highlightedRowId = useAppStore(s => s.highlightedRowId);
  const setCurrentRowId = useAppStore(s => s.setCurrentRowId);
  const setVisibleRange = useAppStore(s => s.setVisibleRange);

  // First-render timestamp (useRef init runs once) → measured against first paint.
  const buildStartRef = useRef(performance.now());
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // During a landing we force a window of scenes around the target OUT of
  // content-visibility skipping (→ 'visible') so they hold their REAL heights
  // while we scroll. Driven by state (not an imperative style write) so React
  // re-renders during the jump — e.g. the highlight flash — don't clobber it.
  const [forcedVisible, setForcedVisible] = useState<{ lo: number; hi: number } | null>(null);

  // Same pericope-chunk builder as VerseGrid (duplicated to keep the shipping
  // grid untouched; this file is throwaway). Each chunk = a section header + its
  // rows, extended forward so multi-row verse spans never cross a chunk edge.
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
        while (
          nextPi < sorted.length &&
          (rowIndexById.get(sorted[nextPi].startRow) ?? Infinity) <= endIdx
        ) {
          subPericopes.push(sorted[nextPi]);
          nextPi++;
          changed = true;
        }
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

  // ---- Lightweight scroll-spy (keeps sidebar highlight + x-ray band alive) ---
  const cellsByIdRef = useRef<Map<number, Set<HTMLElement>>>(new Map());
  const rangeVisibleRef = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const flushRaf = useRef<number | null>(null);

  const setCurrentRowIdRef = useRef(setCurrentRowId);
  setCurrentRowIdRef.current = setCurrentRowId;
  const setVisibleRangeRef = useRef(setVisibleRange);
  setVisibleRangeRef.current = setVisibleRange;

  const flush = useCallback(() => {
    if (flushRaf.current != null) return;
    flushRaf.current = requestAnimationFrame(() => {
      flushRaf.current = null;
      const set = rangeVisibleRef.current;
      if (set.size === 0) {
        setVisibleRangeRef.current(null, null);
        return;
      }
      const containerTop = scrollerRef.current?.getBoundingClientRect().top;
      let minAny = Infinity;
      let max = -Infinity;
      let boundaryId: number | null = null;
      let boundaryTop = Infinity;
      set.forEach(id => {
        if (id < minAny) minAny = id;
        if (id > max) max = id;
        if (containerTop !== undefined) {
          const el = cellsByIdRef.current.get(id)?.values().next().value as HTMLElement | undefined;
          if (el) {
            const top = el.getBoundingClientRect().top;
            if (top >= containerTop - 12 && top < boundaryTop) {
              boundaryTop = top;
              boundaryId = id;
            }
          }
        }
      });
      const reading = boundaryId ?? (minAny === Infinity ? null : minAny);
      setVisibleRangeRef.current(reading, max === -Infinity ? null : max);
      if (reading != null && !useAppStore.getState().isAutoScrolling) {
        setCurrentRowIdRef.current(reading);
      }
    });
  }, []);

  const observeCell = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const id = parseInt(el.dataset.rowId ?? '', 10);
    if (!isNaN(id)) {
      let cells = cellsByIdRef.current.get(id);
      if (!cells) cellsByIdRef.current.set(id, (cells = new Set()));
      cells.add(el);
    }
    if (!observerRef.current) {
      const root = (el.closest('[data-grid-scroller]') as HTMLElement | null) ?? null;
      if (!root) return;
      observerRef.current = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const rid = parseInt((entry.target as HTMLElement).dataset.rowId ?? '', 10);
            if (isNaN(rid)) continue;
            if (entry.isIntersecting) rangeVisibleRef.current.add(rid);
            else rangeVisibleRef.current.delete(rid);
          }
          flush();
        },
        { root, threshold: 0 }
      );
    }
    observerRef.current?.observe(el);
    return () => {
      observerRef.current?.unobserve(el);
      if (!isNaN(id)) {
        const cells = cellsByIdRef.current.get(id);
        cells?.delete(el);
        if (cells && cells.size === 0) {
          cellsByIdRef.current.delete(id);
          rangeVisibleRef.current.delete(id);
        }
        flush();
      }
    };
  }, [flush]);

  // Measure build → first paint, then store it for the HUD.
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        useAppStore.getState().setRenderAllBuildMs(performance.now() - buildStartRef.current);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // scrollToRow — land the target row at the top and KEEP it there, even on a
  // first visit.
  //
  // Why the hand-rolled version failed on iPad (WebKit/WKWebView): scenes use
  // `content-visibility: auto`, so an off-screen scene's INTERNAL layout is
  // skipped and EVERY row inside it reports the SCENE's top for
  // getBoundingClientRect. So our manual "scroll the row to offset 8" math
  // happily parked the SCENE start at the top and saw delta≈0 — the verse sat
  // a dozen rows below the fold (the reported bug). Blink lays the row out when
  // queried, so it never showed there.
  //
  // Fix: delegate the scroll to the engine's native `scrollIntoView()`. The
  // content-visibility spec guarantees scrollIntoView (like find-in-page) lays
  // out and reveals skipped content correctly, in every engine. The 8px gap
  // comes from `scroll-margin-top` on the row. We still force a window of scenes
  // around the target out of skipping (`forcedVisible` state) so their real
  // heights are settled first — WebKit has no scroll anchoring, so this stops an
  // unanchored resize from nudging the target after it lands. A short verify
  // loop re-issues scrollIntoView until the row holds the top; then the forced
  // scenes return to `auto` (their real size is now cached, so no shift).
  const landingRef = useRef<number | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollToRow: (rowId: number, opts?: { instant?: boolean }) => {
        const container = scrollerRef.current;
        if (!container) return;
        const smooth = opts?.instant === false;
        useAppStore.getState().setAutoScrolling(true);
        setCurrentRowId(rowId);

        // A new command supersedes any landing still in progress.
        if (landingRef.current != null) cancelAnimationFrame(landingRef.current);

        // Force the target's neighbourhood to real heights (pixel-sized window:
        // ~1.5 viewports up, ~1 down) so nothing above can resize after landing.
        const targetIdx = pericopeChunks.findIndex(c => c.rows.some(r => r.id === rowId));
        if (targetIdx >= 0) {
          const vh = container.clientHeight || 800;
          const estOf = (i: number) => pericopeChunks[i].rows.length * 88 + 40;
          let lo = targetIdx, accUp = 0;
          while (lo > 0 && accUp < vh * 1.5) { lo--; accUp += estOf(lo); }
          let hi = targetIdx, accDown = 0;
          while (hi < pericopeChunks.length - 1 && accDown < vh) { hi++; accDown += estOf(hi); }
          setForcedVisible({ lo, hi });
        }

        const deadline = performance.now() + 1800;
        const finish = () => {
          landingRef.current = null;
          requestAnimationFrame(() => requestAnimationFrame(() => setForcedVisible(null)));
          useAppStore.getState().setAutoScrolling(false);
        };

        let stable = 0;
        const land = () => {
          const el = container.querySelector(`[data-row-id="${rowId}"]`) as HTMLElement | null;
          if (!el) {
            if (performance.now() < deadline) landingRef.current = requestAnimationFrame(land);
            else finish();
            return;
          }
          // 8px gap, then let the ENGINE reveal the (possibly skipped) row —
          // the part that works in WebKit where manual scrollTop math does not.
          el.style.scrollMarginTop = '8px';
          el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
          if (smooth) { finish(); return; } // animation; re-issuing would restart it
          // Verify against the real, now-laid-out position and hold a few frames
          // so a late unanchored resize is re-corrected.
          const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top;
          stable = Math.abs(top - 8) <= 2 ? stable + 1 : 0;
          if (stable >= 3 || performance.now() > deadline) { finish(); return; }
          landingRef.current = requestAnimationFrame(land);
        };
        landingRef.current = requestAnimationFrame(land);
      },
    }),
    [setCurrentRowId, pericopeChunks]
  );

  return (
    <div
      ref={scrollerRef}
      data-grid-scroller=""
      onScroll={flush}
      style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
    >
      {pericopeChunks.map((chunk, idx) => (
        <div
          key={chunk.pericope.id ?? idx}
          data-cv-chunk={idx}
          style={{
            // The whole point of the experiment: keep the chunk in the DOM but
            // let the browser skip layout/paint while it is off-screen. The
            // `auto` size hint is remembered after the chunk renders once, so
            // the scrollbar settles. Estimate ≈ rows × row height + header.
            // During a landing the target's neighbourhood is forced 'visible'
            // so its real height is settled before we scroll (see scrollToRow).
            contentVisibility:
              forcedVisible && idx >= forcedVisible.lo && idx <= forcedVisible.hi
                ? 'visible'
                : 'auto',
            containIntrinsicSize: `auto ${chunk.rows.length * 88 + 40}px`,
          }}
        >
          <PericopeChunk
            chunk={chunk}
            theme={theme}
            highlightedRowId={highlightedRowId}
            onRowTap={onRowTap}
            onRowLongPress={onRowLongPress}
            observeCell={observeCell}
          />
        </div>
      ))}
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
    </div>
  );
});
