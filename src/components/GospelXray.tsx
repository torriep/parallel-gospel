import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS, TIMELINE_PHASES } from '../lib/types';
import type { Theme } from '../lib/theme';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useT } from '../lib/i18n';

const STRIP_WIDTH = 48;     // px — vertical strip, left of the sidebar
const BUCKETS = 220;        // vertical resolution: ~2750 rows squeezed into 220 slices

interface GospelXrayProps {
  theme: Theme;
  onGoToRow: (rowId: number, opts?: { instant?: boolean }) => void;
}

/**
 * Vertical "x-ray" of the whole harmony, far left of the screen.
 * One lane per gospel, top (start) to bottom (end). Each lane is shaded by
 * verse density — darker where that gospel has many verses in a slice, blank
 * where it is silent — so parallels and solo passages are visible at a glance.
 * Tap or drag to jump the reading view; a marker tracks where you are reading.
 * Regular (iPad/wide) widths only.
 */
export function GospelXray({ theme, onGoToRow }: GospelXrayProps) {
  const rows = useDataStore(s => s.rows);
  const currentRowId = useAppStore(s => s.currentRowId);
  const visibleFirstRowId = useAppStore(s => s.visibleFirstRowId);
  const visibleLastRowId = useAppStore(s => s.visibleLastRowId);
  const widthClass = useWidthClass();
  const tr = useT();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubFrac, setScrubFrac] = useState<number | null>(null);
  // Mirror of scrubFrac for synchronous reads inside event handlers.
  const scrubFracRef = useRef<number | null>(null);
  const setScrub = useCallback((v: number | null) => {
    scrubFracRef.current = v;
    setScrubFrac(v);
  }, []);
  // After a tap/drag navigation we keep the band pinned at the tapped point
  // until the reading view reports its new visible range — so the band lands
  // once, cleanly, instead of sliding while the list settles.
  const awaitingNavRef = useRef(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-bucket verse density for each gospel + a row-id → index lookup. Heavy,
  // so memoized on `rows` only (does NOT recompute as you scroll/read).
  const { density, idToIndex, phaseYs, n } = useMemo(() => {
    const total = rows.length;
    const idToIndex = new Map<number, number>();
    for (let i = 0; i < total; i++) idToIndex.set(rows[i].id, i);

    const density: number[][] = [];
    if (total > 0) {
      for (let b = 0; b < BUCKETS; b++) {
        const lo = Math.floor((b * total) / BUCKETS);
        const hi = Math.max(lo + 1, Math.floor(((b + 1) * total) / BUCKETS));
        const counts = [0, 0, 0, 0];
        for (let i = lo; i < hi && i < total; i++) {
          const r = rows[i];
          if (r.MT) counts[0]++;
          if (r.MC) counts[1]++;
          if (r.LC) counts[2]++;
          if (r.JN) counts[3]++;
        }
        const len = Math.min(hi, total) - lo;
        density.push(counts.map(c => (len > 0 ? c / len : 0)));
      }
    }

    // Phase divider positions (fraction down the strip), for light orientation ticks.
    const phaseYs = total > 0
      ? TIMELINE_PHASES.slice(0, -1).map(p => {
          let idx = rows.findIndex(r => r.id > p.range[1]);
          if (idx < 0) idx = total;
          return idx / total;
        })
      : [];

    return { density, idToIndex, phaseYs, n: total };
  }, [rows]);

  // Static lane artwork — memoized so scrolling (which changes currentRowId)
  // never re-rasterizes the ~880 rects.
  const lanesSvg = useMemo(() => {
    const laneSlot = 100 / GOSPEL_KEYS.length;
    const laneW = laneSlot - 3;
    return (
      <svg
        viewBox={`0 0 100 ${BUCKETS}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
        style={{ display: 'block', position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        {GOSPEL_KEYS.map((key, l) => {
          const x = l * laneSlot + 1.5;
          const color = theme.gospelColors[key];
          return (
            <g key={key}>
              <rect x={x} y={0} width={laneW} height={BUCKETS} fill={color} opacity={0.07} />
              {density.map((d, b) => {
                const v = d[l];
                if (v <= 0) return null;
                return (
                  <rect
                    key={b}
                    x={x}
                    y={b}
                    width={laneW}
                    height={1.04}
                    fill={color}
                    opacity={0.15 + 0.85 * v}
                  />
                );
              })}
            </g>
          );
        })}
        {phaseYs.map((f, i) => (
          <line
            key={i}
            x1={-2}
            x2={102}
            y1={f * BUCKETS}
            y2={f * BUCKETS}
            stroke={theme.textFaint}
            strokeWidth={0.5}
            strokeDasharray="2 3"
            opacity={0.7}
          />
        ))}
      </svg>
    );
  }, [density, phaseYs, theme]);

  const fracFromClientY = useCallback((clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  }, []);

  const navToFrac = useCallback((frac: number, instant = false) => {
    if (n === 0) return;
    const idx = Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))));
    const rowId = rows[idx]?.id;
    if (rowId != null) onGoToRow(rowId, { instant });
  }, [n, rows, onGoToRow]);

  // Clear the pinned band once the reading view reports a fresh visible range
  // (its post-navigation position), or after a short fallback if it doesn't.
  useEffect(() => {
    if (!awaitingNavRef.current) return;
    awaitingNavRef.current = false;
    if (clearTimerRef.current) { clearTimeout(clearTimerRef.current); clearTimerRef.current = null; }
    setScrub(null);
  }, [visibleFirstRowId, visibleLastRowId, setScrub]);

  // Press/drag previews the band; navigation commits once on release. The band
  // stays pinned at the release point until the new range arrives (see effect).
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (clearTimerRef.current) { clearTimeout(clearTimerRef.current); clearTimerRef.current = null; }
    awaitingNavRef.current = false;
    setScrub(fracFromClientY(e.clientY));
  }, [fracFromClientY, setScrub]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubFracRef.current === null) return;
    setScrub(fracFromClientY(e.clientY));
  }, [fracFromClientY, setScrub]);

  const endScrub = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const frac = scrubFracRef.current;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    if (frac === null) return;
    // Jump instantly and keep the band pinned at the tapped point until the
    // reading view reports its settled range (cleared by the effect above).
    awaitingNavRef.current = true;
    navToFrac(frac, true);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      awaitingNavRef.current = false;
      clearTimerRef.current = null;
      setScrub(null);
    }, 600);
  }, [navToFrac, setScrub]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    const curIdx = idToIndex.get(currentRowId) ?? 0;
    const step = e.key === 'PageUp' || e.key === 'PageDown' ? Math.round(n / 20) : Math.round(n / BUCKETS);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      navToFrac(Math.max(0, curIdx - step) / (n - 1));
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      navToFrac(Math.min(n - 1, curIdx + step) / (n - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      navToFrac(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      navToFrac(1);
    }
  }, [n, idToIndex, currentRowId, navToFrac]);

  if (widthClass === 'compact' || n === 0) return null;

  const fracOf = (rowId: number | null) =>
    n > 1 && rowId != null && idToIndex.has(rowId)
      ? (idToIndex.get(rowId) as number) / (n - 1)
      : null;

  const currentFrac = n > 1 ? (idToIndex.get(currentRowId) ?? 0) / (n - 1) : 0;

  // The "you-are-here" band spans the rows actually on screen (first→last
  // visible). Falls back to a point at currentRowId before the viewport has
  // reported a range. While scrubbing, the band collapses to the drag point.
  const firstFrac = fracOf(visibleFirstRowId);
  const lastFrac = fracOf(visibleLastRowId);
  const haveRange = firstFrac !== null && lastFrac !== null;
  const bandTop = scrubFrac !== null
    ? scrubFrac
    : haveRange ? Math.min(firstFrac!, lastFrac!) : currentFrac;
  const bandBottom = scrubFrac !== null
    ? scrubFrac
    : haveRange ? Math.max(firstFrac!, lastFrac!) : currentFrac;

  return (
    <div
      style={{
        width: STRIP_WIDTH,
        flexShrink: 0,
        height: '100%',
        position: 'relative',
        background: theme.surface,
        borderRight: `0.5px solid ${theme.border}`,
        paddingTop: 'env(safe-area-inset-top, 0)',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label={tr('xray.label')}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(((bandTop + bandBottom) / 2) * 100)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onKeyDown={onKeyDown}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: 'ns-resize',
          touchAction: 'none',
          outline: 'none',
        }}
      >
        {lanesSvg}

        {/* You-are-here band: a rectangle covering the rows currently on screen
            (or a thin preview line while scrubbing). */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${bandTop * 100}%`,
            height: `${Math.max(0, bandBottom - bandTop) * 100}%`,
            minHeight: scrubFrac !== null ? 2 : 10,
            transform: scrubFrac !== null ? 'translateY(-1px)' : undefined,
            boxSizing: 'border-box',
            background: scrubFrac !== null ? 'transparent' : `${theme.text}26`,
            border: `1.5px solid ${theme.text}`,
            borderRadius: 2,
            boxShadow: `0 0 0 0.5px ${theme.bg}`,
            opacity: scrubFrac !== null ? 1 : 0.9,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
