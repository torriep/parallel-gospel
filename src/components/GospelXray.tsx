import { useMemo, useRef, useState, useCallback } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS, TIMELINE_PHASES } from '../lib/types';
import type { Theme } from '../lib/theme';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useT } from '../lib/i18n';

const STRIP_WIDTH = 30;     // px — narrow vertical strip, left of the sidebar
const BUCKETS = 220;        // vertical resolution: ~2750 rows squeezed into 220 slices

interface GospelXrayProps {
  theme: Theme;
  onGoToRow: (rowId: number) => void;
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
  const widthClass = useWidthClass();
  const tr = useT();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrubFrac, setScrubFrac] = useState<number | null>(null);

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

  const navToFrac = useCallback((frac: number) => {
    if (n === 0) return;
    const idx = Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))));
    const rowId = rows[idx]?.id;
    if (rowId != null) onGoToRow(rowId);
  }, [n, rows, onGoToRow]);

  // Press/drag previews the marker; navigation commits once on release — so a
  // tap is a single jump and a drag doesn't thrash the virtualized list.
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrubFrac(fracFromClientY(e.clientY));
  }, [fracFromClientY]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setScrubFrac(prev => (prev === null ? prev : fracFromClientY(e.clientY)));
  }, [fracFromClientY]);

  const endScrub = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setScrubFrac(prev => {
      if (prev !== null) navToFrac(prev);
      return null;
    });
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  }, [navToFrac]);

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

  const currentFrac = n > 1 ? (idToIndex.get(currentRowId) ?? 0) / (n - 1) : 0;
  const markerFrac = scrubFrac !== null ? scrubFrac : currentFrac;

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
        aria-valuenow={Math.round(markerFrac * 100)}
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

        {/* You-are-here marker (or scrub preview while dragging) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${markerFrac * 100}%`,
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              height: 2,
              background: theme.text,
              opacity: scrubFrac !== null ? 1 : 0.85,
              boxShadow: `0 0 0 0.5px ${theme.bg}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -1,
              top: -3,
              width: 5,
              height: 8,
              borderRadius: 2,
              background: theme.text,
              boxShadow: `0 0 0 0.5px ${theme.bg}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
