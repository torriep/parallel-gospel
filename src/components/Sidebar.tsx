import { useMemo, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { useUserDataStore } from '../stores/userDataStore';
import type { Theme } from '../lib/theme';
import { TIMELINE_PHASES } from '../lib/types';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useFontScale } from '../hooks/useFontScale';
import { useLanguage, useT } from '../lib/i18n';
import { BookmarkFilledIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, StarIcon } from './icons';

export const SIDEBAR_WIDTH = 220;

interface SidebarProps {
  theme: Theme;
  onGoToRow: (rowId: number) => void;
}

export function Sidebar({ theme, onGoToRow }: SidebarProps) {
  const widthClass = useWidthClass();
  const showSidebar = useAppStore(s => s.showSidebar);
  const setShowSidebar = useAppStore(s => s.setShowSidebar);
  const setShowBookmarks = useAppStore(s => s.setShowBookmarks);
  const currentRowId = useAppStore(s => s.currentRowId);
  const pericopes = useDataStore(s => s.pericopes);
  const bookmarkCount = useUserDataStore(s => s.bookmarks.length);
  const language = useLanguage();
  const tr = useT();
  const fs = useFontScale();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Group pericopes by phase, in order
  const grouped = useMemo(() => {
    const groups: Record<string, typeof pericopes> = {};
    for (const p of pericopes) {
      (groups[p.phase] ??= []).push(p);
    }
    return groups;
  }, [pericopes]);

  const isCompact = widthClass === 'compact';
  const isOpen = showSidebar;

  const handleGo = (rowId: number) => {
    onGoToRow(rowId);
    if (isCompact) setShowSidebar(false);
  };

  const inner = (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        background: theme.isDark ? 'rgba(31,27,22,0.96)' : 'rgba(253,248,240,0.96)',
        borderRight: `0.5px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Palatino Linotype', serif",
      }}
    >
      {/* Sidebar header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: isCompact ? 'calc(env(safe-area-inset-top, 0) + 8px)' : 12,
          padding: '12px 12px 10px',
          borderBottom: `0.5px solid ${theme.borderLight}`,
        }}
      >
        <span style={{ fontSize: fs(13), fontWeight: 700, color: theme.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
          {tr('sidebar.navigation')}
        </span>
        {isCompact && (
          <button
            onClick={() => setShowSidebar(false)}
            aria-label={tr('sidebar.close')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, minWidth: 36, minHeight: 36 }}
          >
            <CloseIcon size={18} color={theme.textMuted} />
          </button>
        )}
      </div>

      {/* Shortcuts */}
      <div style={{ padding: '8px 12px 10px', borderBottom: `0.5px solid ${theme.borderLight}` }}>
        <button
          onClick={() => { setShowBookmarks(true); if (isCompact) setShowSidebar(false); }}
          style={{ ...shortcutBtn(theme), fontSize: fs(13) }}
        >
          <BookmarkFilledIcon size={14} color={theme.gospelColors.JN} />
          <span style={{ flex: 1 }}>{tr('sidebar.bookmarks')}</span>
          {bookmarkCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: theme.textMuted,
                background: theme.surface,
                borderRadius: 8,
                padding: '0 6px',
              }}
            >
              {bookmarkCount}
            </span>
          )}
        </button>
      </div>

      {/* Pericope list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 16px' }}>
        {TIMELINE_PHASES.map(phase => {
          const items = grouped[phase.id] ?? [];
          if (items.length === 0) return null;
          const isCollapsed = collapsed[phase.id];
          return (
            <div key={phase.id} style={{ marginTop: 8 }}>
              <button
                onClick={() => setCollapsed(c => ({ ...c, [phase.id]: !c[phase.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 6,
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.text,
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  minHeight: 32,
                }}
              >
                {isCollapsed ? (
                  <ChevronRightIcon size={12} color={theme.textMuted} />
                ) : (
                  <ChevronDownIcon size={12} color={theme.textMuted} />
                )}
                <span style={{ fontSize: 12, color: theme.gospelColors.LC }}>{phase.icon}</span>
                <span
                  style={{
                    fontSize: fs(12),
                    fontWeight: 700,
                    color: theme.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {tr(`phase.${phase.id}` as const)}
                </span>
              </button>
              {!isCollapsed && (
                <div>
                  {items.map(p => {
                    const isActive = p.startRow <= currentRowId &&
                      (items[items.indexOf(p) + 1]?.startRow ?? Infinity) > currentRowId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleGo(p.startRow)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 10px 7px 26px',
                          background: isActive ? theme.highlight : 'transparent',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: isActive ? theme.text : theme.textMuted,
                          fontSize: fs(13),
                          fontFamily: 'inherit',
                          fontWeight: isActive ? 600 : 400,
                          lineHeight: 1.35,
                          minHeight: 36,
                        }}
                      >
                        {p.label[language]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            fontSize: fs(11),
            color: theme.textFaint,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontStyle: 'italic',
          }}
        >
          <StarIcon size={12} color={theme.textFaint} />
          <span>{pericopes.length} {tr('sidebar.pericopeCount')}</span>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (isCompact) {
    return (
      <>
        <div
          onClick={() => setShowSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 600,
            animation: 'fadeIn 0.18s ease',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 601,
            animation: 'slideInLeft 0.22s ease',
          }}
        >
          {inner}
        </div>
      </>
    );
  }

  return (
    <div style={{ flexShrink: 0, height: '100%' }}>
      {inner}
    </div>
  );
}

function shortcutBtn(theme: Theme): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    marginTop: 6,
    background: 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: theme.text,
    fontSize: 13,
    fontFamily: 'inherit',
    textAlign: 'left',
    minHeight: 36,
  };
}
