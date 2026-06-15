import { useAppStore } from '../stores/appStore';
import { useUserDataStore } from '../stores/userDataStore';
import { GOSPEL_KEYS, GOSPEL_MONOGRAMS } from '../lib/types';
import type { Theme } from '../lib/theme';
import { useT } from '../lib/i18n';
import { useFontScale } from '../hooks/useFontScale';
import { BookmarkIcon } from './icons';

interface StatusBarProps {
  theme: Theme;
  progress: number;
}

export function StatusBar({ theme, progress }: StatusBarProps) {
  const tr = useT();
  const fs = useFontScale();
  const currentRefs = useAppStore(s => s.currentRefs);
  const setShowBookmarks = useAppStore(s => s.setShowBookmarks);
  const bookmarkCount = useUserDataStore(s => s.bookmarks.length);

  const refsText = GOSPEL_KEYS.map(k => {
    const ref = currentRefs[k];
    if (!ref) return null;
    const [chRaw, v] = ref.split('.');
    const ch = chRaw.replace(/[A-Z]/g, '');
    return `${GOSPEL_MONOGRAMS[k]} ${ch}:${v}`;
  }).filter(Boolean).join(' · ');

  return (
    <div
      style={{
        height: 'calc(36px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: theme.isDark
          ? 'rgba(26,22,18,0.85)'
          : 'rgba(250,246,238,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: `0.5px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 12,
        paddingRight: 6,
        fontSize: fs(12),
        color: theme.textMuted,
        fontFamily: "'Palatino Linotype', serif",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: 0.2,
        }}
        title={refsText}
      >
        {refsText || 'MT 1-28 · MC 1-16 · LC 1-24 · JN 1-21'}
      </span>
      <span
        style={{
          color: theme.textFaint,
          fontVariantNumeric: 'tabular-nums',
          fontSize: fs(11),
        }}
      >
        {progress}% {tr('status.read')}
      </span>
      <button
        onClick={() => setShowBookmarks(true)}
        aria-label={tr('bookmarks.title')}
        style={{ ...iconBtn(theme), position: 'relative' }}
      >
        <BookmarkIcon size={18} color={theme.textMuted} />
        {bookmarkCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              fontSize: 9,
              background: theme.gospelColors.JN,
              color: '#fff',
              borderRadius: 8,
              minWidth: 14,
              height: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              padding: '0 3px',
            }}
          >
            {bookmarkCount}
          </span>
        )}
      </button>
    </div>
  );
}

function iconBtn(theme: Theme): React.CSSProperties {
  return {
    width: 44,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: theme.textMuted,
    borderRadius: 8,
    padding: 0,
  };
}
