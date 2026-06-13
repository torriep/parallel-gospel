import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { GOSPEL_KEYS, GOSPEL_MONOGRAMS, type GospelKey } from '../lib/types';
import type { Theme } from '../lib/theme';
import { VersePicker } from './VersePicker';
import { useT } from '../lib/i18n';
import { useFontScale } from '../hooks/useFontScale';
import { ChevronDownIcon, MenuIcon, SearchIcon, SettingsIcon } from './icons';

interface TopChromeProps {
  theme: Theme;
  onVerseSelect: (g: GospelKey, ch: number, v: number) => void;
}

export function TopChrome({ theme, onVerseSelect }: TopChromeProps) {
  const tr = useT();
  const showSidebar = useAppStore(s => s.showSidebar);
  const setShowSidebar = useAppStore(s => s.setShowSidebar);
  const setShowSearch = useAppStore(s => s.setShowSearch);
  const showSettings = useAppStore(s => s.showSettings);
  const setShowSettings = useAppStore(s => s.setShowSettings);

  const [picker, setPicker] = useState<{ key: GospelKey; rect: DOMRect } | null>(null);

  useEffect(() => {
    if (!picker) return;
    const update = () => {
      const el = document.querySelector<HTMLButtonElement>(`button[data-col-key="${picker.key}"]`);
      if (el) setPicker(p => p ? { ...p, rect: el.getBoundingClientRect() } : null);
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [picker]);

  const bg = theme.isDark ? 'rgba(22,22,24,0.78)' : 'rgba(255,255,255,0.82)';
  const border = theme.isDark ? 'rgba(52,52,58,0.5)' : 'rgba(227,224,219,0.55)';

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 30,
        background: bg,
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: `0.5px solid ${border}`,
        paddingTop: 'env(safe-area-inset-top, 0)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          minHeight: 56,
        }}
      >
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          aria-label={tr('sidebar.navigation')}
          aria-pressed={showSidebar}
          style={chromeBtn(theme)}
        >
          <MenuIcon size={22} color={theme.text} />
        </button>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            minWidth: 0,
          }}
        >
          {GOSPEL_KEYS.map((key, i) => (
            <div
              key={key}
              style={{
                borderLeft: i === 0 ? `0.5px solid ${theme.border}` : 'none',
                borderRight: `0.5px solid ${theme.border}`,
                minWidth: 0,
              }}
            >
              <GospelHeader
                gospelKey={key}
                theme={theme}
                onOpen={(k, rect) => setPicker({ key: k, rect })}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowSearch(true)}
          aria-label={tr('top.search')}
          style={chromeBtn(theme)}
        >
          <SearchIcon size={20} color={theme.text} />
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          aria-label={tr('top.settings')}
          aria-pressed={showSettings}
          style={chromeBtn(theme)}
        >
          <SettingsIcon size={22} color={theme.text} />
        </button>
      </div>

      {picker && (
        <VersePicker
          gospelKey={picker.key}
          anchorRect={picker.rect}
          onSelect={onVerseSelect}
          onClose={() => setPicker(null)}
          theme={theme}
        />
      )}
    </div>
  );
}

interface GospelHeaderProps {
  gospelKey: GospelKey;
  theme: Theme;
  onOpen: (key: GospelKey, rect: DOMRect) => void;
}

function GospelHeader({ gospelKey, theme, onOpen }: GospelHeaderProps) {
  const tr = useT();
  const fs = useFontScale();
  const currentRefs = useAppStore(s => s.currentRefs);
  const gospelName = tr(`gospel.${gospelKey}` as const);

  const color = theme.gospelColors[gospelKey];
  const currentRef = currentRefs[gospelKey];
  const ch = currentRef ? currentRef.split('.')[0].replace(/[A-Z]/g, '') : '—';
  const v = currentRef ? currentRef.split('.')[1] : '';

  const btnRef = useRef<HTMLButtonElement>(null);
  const handleOpen = () => {
    if (btnRef.current) onOpen(gospelKey, btnRef.current.getBoundingClientRect());
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        height: '100%',
        background: `linear-gradient(180deg, ${color}10 0%, ${color}05 100%)`,
        borderBottom: `2px solid ${color}`,
        minWidth: 0,
      }}
    >
      <button
        ref={btnRef}
        data-col-key={gospelKey}
        onClick={handleOpen}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: '6px 4px',
          fontFamily: "'Palatino Linotype', serif",
          minHeight: 56,
          color: theme.text,
        }}
        aria-label={`${tr('picker.selectVerse')} ${gospelName}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              background: color,
              padding: '1px 5px',
              borderRadius: 3,
              letterSpacing: 0.3,
              lineHeight: '13px',
              flexShrink: 0,
            }}
          >
            {GOSPEL_MONOGRAMS[gospelKey]}
          </span>
          <span
            style={{
              fontSize: fs(15),
              fontWeight: 700,
              color,
              letterSpacing: 0.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {gospelName}
          </span>
        </div>
        <span
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: fs(12), color: `${color}CC`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ch}{v ? `:${v}` : ''}
          <ChevronDownIcon size={10} color={`${color}AA`} />
        </span>
      </button>
    </div>
  );
}

function chromeBtn(theme: Theme): React.CSSProperties {
  return {
    minWidth: 44,
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: theme.text,
    padding: 0,
    flexShrink: 0,
  };
}
