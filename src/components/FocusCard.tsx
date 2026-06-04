import { useState, useMemo } from 'react';
import { useDataStore } from '../stores/dataStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS, GOSPEL_MONOGRAMS, HIGHLIGHT_COLORS, type GospelKey } from '../lib/types';
import type { Theme } from '../lib/theme';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useFontScale } from '../hooks/useFontScale';
import { useLanguage, useT, type StringKey } from '../lib/i18n';
import {
  BookmarkFilledIcon, BookmarkIcon, CloseIcon, HighlightIcon, PlusIcon,
} from './icons';

// HIGHLIGHT_COLORS is positional (Yellow / Green / Blue / Pink / Purple).
// Map by index to the matching dictionary key for the aria-label and title.
const HIGHLIGHT_COLOR_KEYS: StringKey[] = [
  'color.yellow',
  'color.green',
  'color.blue',
  'color.pink',
  'color.purple',
];

interface FocusCardProps {
  rowId: number;
  onClose: () => void;
  theme: Theme;
}

export function FocusCard({ rowId, onClose, theme }: FocusCardProps) {
  const widthClass = useWidthClass();
  const isCompact = widthClass === 'compact';

  const rows = useDataStore(s => s.rows);
  const secondaryData = useDataStore(s => s.secondaryData);
  const secondaryTranslation = useAppStore(s => s.secondaryTranslation);
  const fontDelta = useAppStore(s => s.fontDelta);
  const systemFontBase = useAppStore(s => s.systemFontBase);

  const {
    highlights, notes, bookmarks,
    addHighlight, removeHighlight, addNote, deleteNote,
    addBookmark, removeBookmark,
  } = useUserDataStore();

  const [noteText, setNoteText] = useState('');
  const [showHighlightPicker, setShowHighlightPicker] = useState<GospelKey | null>(null);
  const tr = useT();
  const fs = useFontScale();
  const language = useLanguage();
  const dateLocale = language === 'fr' ? 'fr-FR' : 'en-US';

  const row = useMemo(() => rows.find(r => r.id === rowId), [rows, rowId]);
  if (!row) return null;

  const presentCount = GOSPEL_KEYS.filter(k => row[k]).length;
  const rowNotes = notes.filter(n => n.rowId === rowId);
  const bookmark = bookmarks.find(b => b.rowId === rowId);
  const bodySize = systemFontBase + fontDelta;

  const handleHighlight = (ref: string, color: string | null) => {
    if (color) addHighlight(ref, color);
    else removeHighlight(ref);
    setShowHighlightPicker(null);
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNote(rowId, noteText.trim());
      setNoteText('');
    }
  };

  const handleToggleBookmark = () => {
    if (bookmark?.id != null) {
      removeBookmark(bookmark.id);
    } else {
      const refs = GOSPEL_KEYS
        .filter(k => row[k])
        .map(k => `${GOSPEL_MONOGRAMS[k]} ${row[k]!.ref.replace(/[A-Z]/g, '').replace('.', ':')}`)
        .join(' · ');
      addBookmark(rowId, refs || `${tr('focus.row')} ${rowId}`);
    }
  };

  const body = (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `0.5px solid ${theme.borderLight}`,
          background: theme.surface,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: fs(15), fontWeight: 700, color: theme.text }}>
            {tr('focus.parallel')}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: theme.textMuted,
              background: theme.card,
              border: `0.5px solid ${theme.border}`,
              borderRadius: 10,
              padding: '1px 8px',
            }}
          >
            {presentCount}/4 {tr('focus.gospelCount')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleToggleBookmark}
            aria-label={bookmark ? tr('focus.removeBookmark') : tr('focus.addBookmark')}
            style={iconBtn(theme)}
          >
            {bookmark
              ? <BookmarkFilledIcon size={20} color={theme.gospelColors.JN} />
              : <BookmarkIcon size={20} color={theme.textMuted} />
            }
          </button>
          <button
            onClick={onClose}
            aria-label={tr('focus.close')}
            style={iconBtn(theme)}
          >
            <CloseIcon size={20} color={theme.textMuted} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1, overflowY: 'auto',
          padding: 14,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        {GOSPEL_KEYS.map(key => {
          const verse = row[key];
          const color = theme.gospelColors[key];
          const present = !!verse;
          const verseHighlight = verse ? highlights.find(h => h.ref === verse.ref) : undefined;

          const secRow = present ? secondaryData?.rows.find(r => r.id === rowId) : undefined;
          const secText = secRow?.[key]?.text;

          return (
            <div
              key={key}
              style={{
                background: verseHighlight ? `${verseHighlight.color}30` : theme.card,
                border: `0.5px solid ${theme.border}`,
                borderLeft: `4px solid ${present ? color : theme.borderLight}`,
                borderRadius: 10,
                padding: 14,
                opacity: present ? 1 : 0.55,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 8, gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      background: color,
                      padding: '2px 7px',
                      borderRadius: 4,
                      letterSpacing: 0.3,
                    }}
                  >
                    {GOSPEL_MONOGRAMS[key]}
                  </span>
                  <span style={{ fontSize: fs(14), fontWeight: 700, color }}>
                    {tr(`gospel.${key}` as const)}
                  </span>
                  {present && verse && (
                    <span style={{ fontSize: fs(12), color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                      {verse.ref.replace(/[A-Z]/g, '').replace('.', ':')}
                    </span>
                  )}
                  {!present && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: theme.textMuted,
                        background: theme.surface,
                        border: `0.5px solid ${theme.border}`,
                        borderRadius: 10,
                        padding: '1px 8px',
                        letterSpacing: 0.3,
                      }}
                    >
                      {tr('focus.absent')}
                    </span>
                  )}
                </div>

                {present && (
                  <button
                    onClick={() => setShowHighlightPicker(showHighlightPicker === key ? null : key)}
                    aria-label={tr('focus.highlight')}
                    style={iconBtn(theme)}
                  >
                    <HighlightIcon size={18} color={verseHighlight ? color : theme.textMuted} />
                  </button>
                )}
              </div>

              {showHighlightPicker === key && verse && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, paddingBottom: 8, flexWrap: 'wrap' }}>
                  {HIGHLIGHT_COLORS.map((h, idx) => {
                    const colorName = tr(HIGHLIGHT_COLOR_KEYS[idx] ?? 'color.yellow');
                    return (
                      <button
                        key={h.name}
                        onClick={() => handleHighlight(verse.ref, h.color)}
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          border: `2px solid ${theme.border}`,
                          background: h.color, cursor: 'pointer',
                          flexShrink: 0,
                        }}
                        title={colorName}
                        aria-label={colorName}
                      />
                    );
                  })}
                  {verseHighlight && (
                    <button
                      onClick={() => handleHighlight(verse.ref, null)}
                      style={{
                        fontSize: fs(12), color: theme.textMuted, background: 'transparent',
                        border: `0.5px solid ${theme.border}`, borderRadius: 14, padding: '4px 12px',
                        cursor: 'pointer', fontFamily: 'inherit',
                        minHeight: 32,
                      }}
                    >
                      {tr('focus.clear')}
                    </button>
                  )}
                </div>
              )}

              {present && verse ? (
                <p style={{ fontSize: bodySize, lineHeight: 1.7, color: theme.text, margin: 0 }}>
                  {verse.text}
                </p>
              ) : (
                <p
                  style={{
                    fontSize: bodySize - 1, lineHeight: 1.6, color: theme.textFaint,
                    margin: 0, fontStyle: 'italic',
                  }}
                >
                  {tr('focus.noParallel')} {tr(`gospel.${key}` as const)} {tr('focus.atThisRow')}
                </p>
              )}

              {present && secondaryTranslation && secText && (
                <p style={{
                  fontSize: bodySize - 2, lineHeight: 1.6, color: theme.textMuted,
                  margin: '10px 0 0', paddingTop: 10,
                  borderTop: `1px dashed ${theme.border}`, fontStyle: 'italic',
                }}>
                  [{secondaryTranslation}] {secText}
                </p>
              )}
            </div>
          );
        })}

        {/* Notes */}
        <div
          style={{
            background: theme.surface, border: `0.5px solid ${theme.border}`,
            borderRadius: 10, padding: 12,
          }}
        >
          <span
            style={{
              fontSize: fs(11), fontWeight: 700, color: theme.textFaint,
              display: 'block', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: 1,
            }}
          >
            {tr('focus.notes')}
          </span>
          {rowNotes.map(n => (
            <div
              key={n.id}
              style={{
                fontSize: fs(13), color: theme.text, padding: '8px 0',
                borderBottom: `0.5px solid ${theme.borderLight}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ flex: 1 }}>{n.text}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: fs(10), color: theme.textFaint }}>
                  {new Date(n.createdAt).toLocaleDateString(dateLocale)}
                </span>
                <button
                  onClick={() => n.id != null && deleteNote(n.id)}
                  aria-label={tr('focus.delete')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    minWidth: 32, minHeight: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <CloseIcon size={14} color={theme.textMuted} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              placeholder={tr('focus.notePlaceholder')}
              style={{
                flex: 1, padding: '10px 12px',
                border: `0.5px solid ${theme.border}`,
                borderRadius: 10, background: theme.card, color: theme.text,
                fontSize: fs(14), fontFamily: 'inherit', outline: 'none',
                minHeight: 44,
              }}
            />
            <button
              onClick={handleAddNote}
              aria-label={tr('focus.add')}
              style={{
                minWidth: 44, minHeight: 44,
                background: theme.gospelColors.LC, border: 'none',
                borderRadius: 10, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <PlusIcon size={20} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (isCompact) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end',
          animation: 'fadeIn 0.18s ease',
          fontFamily: "'Palatino Linotype', serif",
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxHeight: '92vh',
            background: theme.bg,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInBottom 0.24s ease',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.borderLight }} />
          </div>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease',
        fontFamily: "'Palatino Linotype', serif",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(720px, 100%)',
          maxHeight: 'min(92vh, 880px)',
          background: theme.bg,
          borderRadius: 16,
          border: `0.5px solid ${theme.border}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          animation: 'scaleIn 0.18s ease',
        }}
      >
        {body}
      </div>
    </div>
  );
}

function iconBtn(theme: Theme): React.CSSProperties {
  return {
    minWidth: 44, minHeight: 44,
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: theme.textMuted, borderRadius: 10,
  };
}
