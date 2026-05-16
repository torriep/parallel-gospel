import { Fragment, useCallback, useMemo, useRef } from 'react';
import { GOSPEL_KEYS, type GospelRow, type Pericope } from '../lib/types';
import { VerseCell } from './VerseCell';
import { SectionHeader } from './SectionHeader';
import type { Theme } from '../lib/theme';

export type PericopeChunkData = {
  pericope: Pericope & { startRow: number };
  rows: GospelRow[];
  subPericopes: Array<Pericope & { startRow: number }>;
};

interface PericopeChunkProps {
  chunk: PericopeChunkData;
  theme: Theme;
  highlightedRowId: number | null;
  onRowTap: (rowId: number) => void;
  onRowLongPress: (rowId: number) => void;
  observeCell: (el: HTMLElement | null) => void | (() => void);
}

export function PericopeChunk({
  chunk,
  theme,
  highlightedRowId,
  onRowTap,
  onRowLongPress,
  observeCell,
}: PericopeChunkProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Map absorbed-pericope startRow → label, for inline headers inside this chunk.
  const subHeaderByRow = useMemo(() => {
    const rowIds = new Set(chunk.rows.map(r => r.id));
    const map = new Map<number, string>();
    for (const sp of chunk.subPericopes) {
      if (!rowIds.has(sp.startRow)) {
        // eslint-disable-next-line no-console
        console.warn(
          `Sub-pericope "${sp.label}" startRow ${sp.startRow} not in chunk "${chunk.pericope.label}" — skipping inline header`
        );
        continue;
      }
      map.set(sp.startRow, sp.label);
    }
    return map;
  }, [chunk]);

  return (
    <>
      <SectionHeader label={chunk.pericope.label} theme={theme} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        {chunk.rows.map(row => {
          const isHighlighted = highlightedRowId === row.id;
          const subLabel = subHeaderByRow.get(row.id);
          return (
            <Fragment key={row.id}>
              {subLabel && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    padding: '6px 16px',
                    textAlign: 'center',
                    background: theme.isDark
                      ? 'rgba(60, 50, 35, 0.4)'
                      : 'rgba(245, 230, 200, 0.25)',
                    borderTop: `1px solid ${theme.borderLight}`,
                    borderBottom: `1px solid ${theme.borderLight}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75em',
                      fontWeight: 600,
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                    }}
                  >
                    {subLabel}
                  </span>
                </div>
              )}
              {GOSPEL_KEYS.map((key, i) => {
                if (row.merges?.[key]) return null;
                const verse = row[key];
                const span = verse?.span ?? 1;
                return (
                  <div
                    key={key}
                    ref={observeCell}
                    data-row-id={row.id}
                    onClick={() => onRowTap(row.id)}
                    onMouseDown={() => {
                      longPressTimer.current = setTimeout(() => onRowLongPress(row.id), 600);
                    }}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={() => {
                      longPressTimer.current = setTimeout(() => onRowLongPress(row.id), 600);
                    }}
                    onTouchEnd={clearLongPress}
                    className={isHighlighted ? 'highlight-flash' : ''}
                    style={{
                      gridRow: span > 1 ? `span ${span}` : undefined,
                      borderRight: i < GOSPEL_KEYS.length - 1 ? `1px solid ${theme.borderLight}` : 'none',
                      borderBottom: `1px solid ${theme.borderLight}`,
                    }}
                  >
                    <VerseCell
                      verse={verse}
                      gospelKey={key}
                      row={row}
                      isHighlighted={isHighlighted}
                      theme={theme}
                    />
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}
