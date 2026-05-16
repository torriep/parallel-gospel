import { useMemo } from 'react';
import type { VerseData, GospelKey, GospelRow } from '../lib/types';
import { GOSPEL_MONOGRAMS } from '../lib/types';
import { useAppStore } from '../stores/appStore';
import { useUserDataStore } from '../stores/userDataStore';
import { useDataStore } from '../stores/dataStore';
import { getCommonWords } from '../lib/diff';
import type { Theme } from '../lib/theme';

interface VerseCellProps {
  verse: VerseData | null;
  gospelKey: GospelKey;
  row: GospelRow;
  isHighlighted: boolean;
  theme: Theme;
}

export function VerseCell({ verse, gospelKey, row, isHighlighted, theme }: VerseCellProps) {
  const fontDelta = useAppStore(s => s.fontDelta);
  const systemFontBase = useAppStore(s => s.systemFontBase);
  const showDifferences = useAppStore(s => s.showDifferences);
  const secondaryTranslation = useAppStore(s => s.secondaryTranslation);
  const highlight = useUserDataStore(s => s.highlights.find(h => h.ref === verse?.ref));
  const secondaryData = useDataStore(s => s.secondaryData);

  const color = theme.gospelColors[gospelKey];
  const fontSize = systemFontBase + fontDelta - 4; // body slightly under system base in dense grid

  const commonWords = useMemo(() => {
    if (!showDifferences || !verse) return new Set<string>();
    return getCommonWords(row, gospelKey);
  }, [showDifferences, row, gospelKey, verse]);

  const secondaryText = useMemo(() => {
    if (!secondaryTranslation || !verse || !secondaryData) return null;
    const secRow = secondaryData.rows.find(r => r.id === row.id);
    return secRow?.[gospelKey]?.text ?? null;
  }, [secondaryTranslation, verse, secondaryData, row.id, gospelKey]);

  if (!verse) {
    return (
      <div style={{
        padding: '8px 6px', minHeight: 40,
        background: theme.empty,
      }} />
    );
  }

  const refParts = verse.ref.split('.');
  const chapter = refParts[0].replace(/[A-Z]/g, '');
  const verseNum = refParts[1];

  let bgColor = theme.card;
  if (highlight) bgColor = `${highlight.color}40`;
  else if (isHighlighted) bgColor = theme.highlight;

  return (
    <div style={{
      padding: '8px 7px',
      background: bgColor,
      transition: 'background 0.3s ease',
      cursor: 'pointer',
      height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color,
            background: `${color}20`,
            border: `0.5px solid ${color}55`,
            borderRadius: 4,
            padding: '0 4px',
            letterSpacing: 0.3,
            lineHeight: '14px',
            flexShrink: 0,
          }}
          aria-label={`Évangile: ${GOSPEL_MONOGRAMS[gospelKey]}`}
        >
          {GOSPEL_MONOGRAMS[gospelKey]}
        </span>
        <span style={{
          fontSize: Math.max(10, fontSize - 2),
          fontWeight: 600,
          color,
          fontFamily: "'Palatino Linotype', serif",
          opacity: 0.85,
          flexShrink: 0,
        }}>
          {chapter}:{verseNum}
        </span>
      </div>
      <span style={{
        fontSize, lineHeight: 1.55, color: theme.text,
        fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      }}>
        {showDifferences ? (
          verse.text.split(' ').map((word, i) => {
            const cleanWord = word.toLowerCase().replace(/[.,;:!?'"()]/g, '');
            const isCommon = commonWords.has(cleanWord);
            return (
              <span key={i} style={{
                background: isCommon ? `${color}25` : 'transparent',
                borderBottom: isCommon ? `1px dotted ${color}` : 'none',
              }}>{word} </span>
            );
          })
        ) : verse.text}
      </span>

      {secondaryText && (
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: `1px dashed ${theme.borderLight}`,
          fontSize: Math.max(10, fontSize - 2),
          color: theme.textMuted,
          fontStyle: 'italic', lineHeight: 1.45,
        }}>
          [{secondaryTranslation}] {secondaryText}
        </div>
      )}
    </div>
  );
}
