import { useUserDataStore } from '../stores/userDataStore';
import type { Theme } from '../lib/theme';

interface BookmarksPanelProps {
  onGoToRow: (rowId: number) => void;
  onClose: () => void;
  theme: Theme;
}

export function BookmarksPanel({ onGoToRow, onClose, theme }: BookmarksPanelProps) {
  const { bookmarks, removeBookmark } = useUserDataStore();

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: theme.bg, zIndex: 400, display: 'flex', flexDirection: 'column',
      fontFamily: "'Palatino Linotype', serif",
    }}>
      <div style={{
        padding: '12px 16px', background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Signets</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: theme.textMuted, fontFamily: 'inherit',
          }}
        >Fermer</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {bookmarks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 14 }}>
            Aucun signet. Appuyez longuement sur un verset pour en ajouter.
          </div>
        )}
        {bookmarks.map(bm => (
          <div
            key={bm.id}
            style={{
              padding: '12px 16px', borderBottom: `1px solid ${theme.borderLight}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <button
              onClick={() => { onGoToRow(bm.rowId); onClose(); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', flex: 1, fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{bm.label}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                {new Date(bm.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </button>
            <button
              onClick={() => bm.id && removeBookmark(bm.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 16, color: theme.textMuted, padding: '4px 8px',
              }}
            >&#215;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
