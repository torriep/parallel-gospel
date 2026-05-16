import { useState, useMemo } from 'react';
import { useDataStore } from '../stores/dataStore';
import { TIMELINE_PHASES } from '../lib/types';
import { searchVerses } from '../lib/search';
import type { Theme } from '../lib/theme';

interface SearchPanelProps {
  onClose: () => void;
  onGoToRow: (rowId: number) => void;
  theme: Theme;
}

const PERICOPE_LIMIT = 12;
const VERSE_LIMIT = 30;
const VERSE_MIN_CHARS = 3;

const PHASE_BY_ID = Object.fromEntries(TIMELINE_PHASES.map(p => [p.id, p]));

function formatStartRef(startRef: string): string {
  const m = startRef.match(/^([A-Z]{2})(\d+)\.(\d+)$/);
  if (!m) return startRef;
  const [, gospel, chapter, verse] = m;
  return `${gospel} ${chapter}:${verse}`;
}

export function SearchPanel({ onClose, onGoToRow, theme }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const rows = useDataStore(s => s.rows);
  const pericopes = useDataStore(s => s.pericopes);

  const trimmed = query.trim();
  const qLower = trimmed.toLowerCase();

  const pericopeResults = useMemo(() => {
    if (qLower.length < 1) return [];
    return pericopes
      .filter(p => p.label.toLowerCase().includes(qLower))
      .slice(0, PERICOPE_LIMIT);
  }, [pericopes, qLower]);

  const verseResults = useMemo(() => {
    if (qLower.length < VERSE_MIN_CHARS) return [];
    return searchVerses(rows, qLower, VERSE_LIMIT);
  }, [rows, qLower]);

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '12px 12px 6px',
    fontSize: 11,
    fontWeight: 700,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  };

  const showEmptyHint = trimmed.length === 0;
  const showNoResults =
    !showEmptyHint &&
    pericopeResults.length === 0 &&
    verseResults.length === 0 &&
    qLower.length >= VERSE_MIN_CHARS;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: theme.bg, zIndex: 400, display: 'flex', flexDirection: 'column',
      fontFamily: "'Palatino Linotype', serif",
    }}>
      <div style={{
        padding: '10px 12px', background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher une péricope ou un mot..."
          style={{
            flex: 1, padding: '10px 14px', border: `1px solid ${theme.border}`,
            borderRadius: 8, background: theme.card, color: theme.text,
            fontSize: 15, fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: theme.textMuted, fontFamily: 'inherit',
          }}
        >Annuler</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        {showEmptyHint && (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 14 }}>
            Cherchez une péricope ou un mot dans les versets.
          </div>
        )}

        {showNoResults && (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 14 }}>
            Aucun résultat pour &laquo; {trimmed} &raquo;
          </div>
        )}

        {pericopeResults.length > 0 && (
          <>
            <div style={sectionHeaderStyle}>Péricopes</div>
            {pericopeResults.map(p => {
              const phase = PHASE_BY_ID[p.phase];
              return (
                <button
                  key={p.id}
                  onClick={() => { onGoToRow(p.startRow); onClose(); }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', gap: 10,
                    padding: '10px 12px', border: 'none',
                    borderBottom: `1px solid ${theme.borderLight}`,
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 14, color: theme.gospelColors.LC, width: 16, textAlign: 'center' }}>
                    {phase?.icon ?? '•'}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: theme.text }}>
                    {p.label}
                  </span>
                  <span style={{ fontSize: 11, color: theme.textFaint, fontVariantNumeric: 'tabular-nums' }}>
                    {formatStartRef(p.startRef)}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {verseResults.length > 0 && (
          <>
            <div style={sectionHeaderStyle}>Versets</div>
            {verseResults.map((r, i) => (
              <div key={`${r.row.id}-${i}`}>
                {r.matches.map((m, mi) => {
                  const color = theme.gospelColors[m.key];
                  const idx = m.text.toLowerCase().indexOf(qLower);
                  const before = m.text.substring(Math.max(0, idx - 30), idx);
                  const match = m.text.substring(idx, idx + qLower.length);
                  const after = m.text.substring(idx + qLower.length, idx + qLower.length + 60);

                  return (
                    <button
                      key={`${r.row.id}-${m.key}-${mi}`}
                      onClick={() => { onGoToRow(r.row.id); onClose(); }}
                      style={{
                        display: 'block', width: '100%', padding: '10px 12px',
                        border: 'none', borderBottom: `1px solid ${theme.borderLight}`,
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                        fontFamily: 'inherit',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#fff',
                          background: color, padding: '1px 6px', borderRadius: 4,
                        }}>{m.key}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color }}>
                          {m.ref.replace(/[A-Z]/g, '').replace('.', ':')}
                        </span>
                        <span style={{ fontSize: 10, color: theme.textFaint }}>
                          {r.gospelCount === 1 ? 'unique' : `${r.gospelCount} évangiles`}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>
                        ...{before}
                        <span style={{
                          background: '#FFEAA7', color: '#000', fontWeight: 600,
                          padding: '0 1px', borderRadius: 2,
                        }}>{match}</span>
                        {after}...
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
