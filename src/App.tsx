import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { useDataStore } from './stores/dataStore';
import { useUserDataStore } from './stores/userDataStore';
import { useTheme } from './lib/theme';
import { GOSPEL_KEYS, type GospelKey } from './lib/types';
import { useSystemFontBase } from './hooks/useSystemFontBase';
import { useT } from './lib/i18n';

import { TopChrome } from './components/TopChrome';
import { VerseGrid, type VerseGridHandle } from './components/VerseGrid';
import { StatusBar } from './components/StatusBar';
import { FocusCard } from './components/FocusCard';
import { SearchPanel } from './components/SearchPanel';
import { BookmarksPanel } from './components/BookmarksPanel';
import { ReadingPlansPanel } from './components/ReadingPlansPanel';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/SettingsPanel';
import { GospelXray } from './components/GospelXray';

import './index.css';

function App() {
  const {
    isDarkMode, loadSettings,
    focusRowId, setFocusRowId,
    showSearch, setShowSearch,
    showBookmarks, setShowBookmarks,
    showReadingPlans, setShowReadingPlans,
    showSettings, setShowSettings,
    setHighlightedRowId, setCurrentRefs,
    currentRowId, fontDelta, systemFontBase,
  } = useAppStore();

  const { loadTranslation, rows, isLoading, findRowByRef } = useDataStore();
  const { loadAll: loadUserData, addBookmark, bookmarks, removeBookmark } = useUserDataStore();
  const theme = useTheme(isDarkMode);
  const tr = useT();
  const gridRef = useRef<VerseGridHandle>(null);

  useSystemFontBase();

  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    loadSettings();
    loadTranslation('LSG');
    loadUserData();
  }, []);

  useEffect(() => {
    const totalRows = rows.length;
    if (totalRows === 0) return;
    const currentIndex = rows.findIndex(r => r.id === currentRowId);
    if (currentIndex >= 0) {
      const pct = Math.round((currentIndex / totalRows) * 100);
      setReadProgress(prev => Math.max(prev, pct));
    }
  }, [currentRowId, rows]);

  const scrollToRow = useCallback((rowId: number) => {
    gridRef.current?.scrollToRow(rowId);
    setHighlightedRowId(rowId);
    setTimeout(() => setHighlightedRowId(null), 2000);
  }, [setHighlightedRowId]);

  const handleVerseSelect = useCallback((gospel: GospelKey, chapter: number, verse: number) => {
    const rowId = findRowByRef(gospel, chapter, verse);
    if (rowId == null) return;
    scrollToRow(rowId);
    const row = rows.find(r => r.id === rowId);
    if (row) {
      const refs: Record<GospelKey, string | null> = { MT: null, MC: null, LC: null, JN: null };
      for (const key of GOSPEL_KEYS) {
        refs[key] = row[key]?.ref ?? null;
      }
      setCurrentRefs(refs);
    }
  }, [findRowByRef, rows, scrollToRow, setCurrentRefs]);

  const handleRowTap = useCallback((rowId: number) => {
    setFocusRowId(rowId);
  }, [setFocusRowId]);

  const handleRowLongPress = useCallback((rowId: number) => {
    const existing = bookmarks.find(b => b.rowId === rowId);
    if (existing?.id != null) {
      removeBookmark(existing.id);
      return;
    }
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const refs = GOSPEL_KEYS
      .filter(k => row[k])
      .map(k => {
        const r = row[k]!.ref;
        const [chRaw, v] = r.split('.');
        const ch = chRaw.replace(/[A-Z]/g, '');
        return `${k.slice(0, 1)}${k.slice(1).toLowerCase()} ${ch}:${v}`;
      })
      .join(' · ');
    addBookmark(rowId, refs || `Rang ${rowId}`);
  }, [rows, addBookmark, bookmarks, removeBookmark]);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%', height: '100dvh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: theme.bg, color: theme.text,
          fontFamily: "'Palatino Linotype', serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>&#10022;</div>
          <div style={{ fontSize: 14, color: theme.textMuted }}>{tr('app.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%', height: '100dvh',
        background: theme.bg,
        display: 'flex',
        fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
        overflow: 'hidden', position: 'relative',
        fontSize: systemFontBase + fontDelta,
        color: theme.text,
      }}
    >
      <GospelXray theme={theme} onGoToRow={scrollToRow} />
      <Sidebar theme={theme} onGoToRow={scrollToRow} />

      <div
        style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          minWidth: 0,
          position: 'relative',
        }}
      >
        <TopChrome theme={theme} onVerseSelect={handleVerseSelect} />
        <VerseGrid
          ref={gridRef}
          theme={theme}
          onRowTap={handleRowTap}
          onRowLongPress={handleRowLongPress}
        />
        <StatusBar theme={theme} progress={readProgress} />

        {showSettings && (
          <SettingsPanel theme={theme} onClose={() => setShowSettings(false)} />
        )}
      </div>

      {/* Overlay panels */}
      {showSearch && (
        <SearchPanel
          onClose={() => setShowSearch(false)}
          onGoToRow={scrollToRow}
          theme={theme}
        />
      )}
      {showBookmarks && (
        <BookmarksPanel
          onGoToRow={scrollToRow}
          onClose={() => setShowBookmarks(false)}
          theme={theme}
        />
      )}
      {showReadingPlans && (
        <ReadingPlansPanel
          onClose={() => setShowReadingPlans(false)}
          theme={theme}
        />
      )}
      {focusRowId !== null && (
        <FocusCard
          rowId={focusRowId}
          onClose={() => setFocusRowId(null)}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;
