import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import type { GospelKey } from '../lib/types';
import { GOSPEL_MONOGRAMS } from '../lib/types';
import { useDataStore } from '../stores/dataStore';
import type { Theme } from '../lib/theme';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useFontScale } from '../hooks/useFontScale';
import { useT } from '../lib/i18n';
import { ChevronRightIcon, CloseIcon } from './icons';

interface VersePickerProps {
  gospelKey: GospelKey;
  anchorRect: DOMRect | null;
  onSelect: (gospel: GospelKey, chapter: number, verse: number) => void;
  onClose: () => void;
  theme: Theme;
}

export function VersePicker({ gospelKey, anchorRect, onSelect, onClose, theme }: VersePickerProps) {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const chapterIndex = useDataStore(s => s.chapterIndex);
  const widthClass = useWidthClass();
  const isCompact = widthClass === 'compact';

  const tr = useT();
  const fs = useFontScale();
  const color = theme.gospelColors[gospelKey];
  const gospelName = tr(`gospel.${gospelKey}` as const);

  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; flip: boolean; pointerLeft: number } | null>(null);

  useLayoutEffect(() => {
    if (isCompact || !anchorRect || !popoverRef.current) return;
    const POP_W = 360;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popH = popoverRef.current.offsetHeight || 420;

    const anchorCenter = anchorRect.left + anchorRect.width / 2;
    let left = Math.round(anchorCenter - POP_W / 2);
    left = Math.max(margin, Math.min(vw - POP_W - margin, left));

    const spaceBelow = vh - anchorRect.bottom;
    const flip = spaceBelow < popH + margin && anchorRect.top > popH + margin;
    const top = flip
      ? Math.round(anchorRect.top - popH - 10)
      : Math.round(anchorRect.bottom + 10);

    const pointerLeft = Math.round(anchorCenter - left);
    setPos({ left, top, flip, pointerLeft });
  }, [anchorRect, isCompact, selectedChapter]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!chapterIndex) return null;
  const gospelChapters = chapterIndex[gospelKey];
  const chapterNumbers = Object.keys(gospelChapters).map(Number).sort((a, b) => a - b);
  const verseNumbers = selectedChapter
    ? Object.keys(gospelChapters[String(selectedChapter)]?.verses ?? {}).map(Number).sort((a, b) => a - b)
    : [];

  const FOOTER = (
    <div
      style={{
        padding: '10px 14px',
        fontSize: fs(11),
        color: theme.textFaint,
        fontStyle: 'italic',
        borderTop: `0.5px solid ${theme.borderLight}`,
        lineHeight: 1.4,
        background: theme.surface,
      }}
    >
      {tr('picker.parallel')}
    </div>
  );

  const HEADER = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        borderBottom: `0.5px solid ${theme.borderLight}`,
        background: theme.surface,
        minHeight: 44,
      }}
    >
      {selectedChapter && (
        <button
          onClick={() => setSelectedChapter(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color, fontFamily: 'inherit', fontSize: fs(14), minHeight: 36,
            paddingRight: 6,
          }}
        >
          <ChevronRightIcon size={14} color={color} style={{ transform: 'rotate(180deg)' }} />
          {tr('picker.chapters')}
        </button>
      )}
      <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            background: color,
            padding: '1px 6px',
            borderRadius: 4,
            letterSpacing: 0.3,
          }}
        >
          {GOSPEL_MONOGRAMS[gospelKey]}
        </span>
        <span style={{ fontWeight: 700, color: theme.text, fontSize: fs(15) }}>
          {selectedChapter ? `${gospelName} ${selectedChapter}` : gospelName}
        </span>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          minWidth: 36, minHeight: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label={tr('picker.close')}
      >
        <CloseIcon size={18} color={theme.textMuted} />
      </button>
    </div>
  );

  const GRID = (
    <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
      {!selectedChapter ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {chapterNumbers.map(ch => (
            <button
              key={ch}
              onClick={() => setSelectedChapter(ch)}
              style={{
                aspectRatio: '1', minWidth: 36, minHeight: 36,
                border: `0.5px solid ${theme.border}`,
                borderRadius: 8, background: theme.card, cursor: 'pointer',
                fontSize: fs(15), fontWeight: 600, color, fontFamily: 'inherit',
              }}
            >
              {ch}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {verseNumbers.map(v => (
            <button
              key={v}
              onClick={() => { onSelect(gospelKey, selectedChapter, v); onClose(); }}
              style={{
                minWidth: 28, minHeight: 36,
                border: `0.5px solid ${theme.border}`,
                borderRadius: 6, background: theme.card, cursor: 'pointer',
                fontSize: fs(13), color, fontFamily: 'inherit',
                padding: 0,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (isCompact) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 700,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end',
          animation: 'fadeIn 0.18s ease',
        }}
      >
        <div
          ref={popoverRef}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxHeight: '80vh',
            background: theme.pickerBg,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Palatino Linotype', serif",
            animation: 'slideInBottom 0.24s ease',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.borderLight }} />
          </div>
          {HEADER}
          {GRID}
          {FOOTER}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        width: 360,
        maxHeight: 480,
        zIndex: 700,
        background: theme.pickerBg,
        border: `0.5px solid ${theme.pickerBorder}`,
        borderRadius: 14,
        boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
        display: pos ? 'flex' : 'none',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Palatino Linotype', serif",
        animation: 'scaleIn 0.16s ease',
      }}
    >
      {pos && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: Math.max(8, Math.min(360 - 16, pos.pointerLeft - 6)),
            width: 12,
            height: 12,
            transform: 'rotate(45deg)',
            background: theme.pickerBg,
            border: `0.5px solid ${theme.pickerBorder}`,
            ...(pos.flip
              ? { bottom: -6, borderTop: 'none', borderLeft: 'none' }
              : { top: -6, borderBottom: 'none', borderRight: 'none' }),
          }}
        />
      )}
      {HEADER}
      {GRID}
      {FOOTER}
    </div>
  );
}
