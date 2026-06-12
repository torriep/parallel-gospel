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
  const isAutoScrolling = useAppStore(s => s.isAutoScrolling);
  const widthClass = useWidthClass();
  const tr = useT();

  const containerRef = useRef<HTMLDivElement>(null);
  // BI-DIRECTIONAL: normally the band tracks the reading position (top of the
  // viewport), so manual scrolling moves it. While the user is dragging it, OR
  // while the tap-triggered auto-scroll is still running, we show the pinned
  // position instead. Tracking resumes only after the scroll has settled AND
  // the visible-range data has stopped changing (see release effect below).
  const [pinFrac, setPinFrac] = useState<number | null>(null);
  const pinFracRef = useRef<number | null>(null);
  const setPin = useCallback((v: number | null) => {
    pinFracRef.current = v;
    setPinFrac(v);
  }, []);
  const draggingRef = useRef(false);

  // Release the pin only when the grid has TRULY stopped moving: the
  // auto-scroll flag is off AND the visible-range data has been stable for
  // ~200ms. (The flag alone is not enough: it flips off 150ms after the last
  // scroll event, but the IntersectionObserver that feeds visibleFirstRowId
  // can report later than that while a large pericope is still laying out —
  // unfreezing on the flag alone made the rectangle follow stale, shifting
  // data. That was the intermittent jump.) This effect re-runs on every
  // visibleFirstRowId change, so the timer keeps re-arming while the data is
  // still moving and only fires once it has settled.
  const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (pinFrac === null || isAutoScrolling) return;
    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null;
      if (!draggingRef.current) setPin(null);
    }, 200);
    return () => {
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = null;
      }
    };
  }, [pinFrac, isAutoScrolling, visibleFirstRowId, setPin]);

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

  const fracOfId = useCallback((id: number | null) =>
    n > 1 && id != null && idToIndex.has(id)
      ? (idToIndex.get(id) as number) / (n - 1)
      : null,
  [n, idToIndex]);

  // Pin the band at a position and scroll the verses there instantly. The pin
  // holds the band still while the auto-scroll runs; VerseGrid flips
  // isAutoScrolling false once the scroll has settled, and tracking resumes.
  const commitTo = useCallback((frac: number) => {
    const f = Math.min(1, Math.max(0, frac));
    setPin(f);
    navToFrac(f, true);
  }, [setPin, navToFrac]);

  // Press/drag pins the band to the pointer; release commits the scroll.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture can throw for synthetic/edge-case pointers; dragging works without it */ }
    draggingRef.current = true;
    setPin(fracFromClientY(e.clientY));
  }, [fracFromClientY, setPin]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    setPin(fracFromClientY(e.clientY));
  }, [fracFromClientY, setPin]);

  const endScrub = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    commitTo(fracFromClientY(e.clientY));
  }, [fracFromClientY, commitTo]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    const base = pinFracRef.current ?? fracOfId(visibleFirstRowId) ?? ((idToIndex.get(currentRowId) ?? 0) / Math.max(1, n - 1));
    const curIdx = Math.round(base * (n - 1));
    const step = e.key === 'PageUp' || e.key === 'PageDown' ? Math.round(n / 20) : Math.round(n / BUCKETS);
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      commitTo(Math.max(0, curIdx - step) / (n - 1));
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      commitTo(Math.min(n - 1, curIdx + step) / (n - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      commitTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      commitTo(1);
    }
  }, [n, idToIndex, currentRowId, visibleFirstRowId, fracOfId, commitTo]);

  if (widthClass === 'compact' || n === 0) return null;

  const currentFrac = n > 1 ? (idToIndex.get(currentRowId) ?? 0) / (n - 1) : 0;
  // Band centre. While the user is dragging it, or while the tap-triggered
  // auto-scroll is still running, show the pinned position (frozen — the
  // scrolling can't push it). Otherwise follow the top of the visible range,
  // so manual scrolling moves it (bi-directional). Height is fixed.
  const liveFrac = fracOfId(visibleFirstRowId) ?? currentFrac;
  // As long as a pin exists, show it — the release effect above clears it only
  // once the grid has demonstrably stopped moving, so the handoff is seamless.
  const markerCenter = pinFrac !== null ? pinFrac : liveFrac;

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
        aria-valuenow={Math.round(markerCenter * 100)}
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

        {/* Position handle: fixed-height rectangle that sits where the user set
            it. Driven only by tapping/dragging the strip — scrolling the verses
            never moves or resizes it. */}
        {/* White with a dark outer ring: visible on both the dark density ink
            and the light strip background, in both themes (the old theme.text
            border vanished against dark lanes). */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${markerCenter * 100}%`,
            height: 26,
            transform: 'translateY(-50%)',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.18)',
            border: '2.5px solid #ffffff',
            borderRadius: 3,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
