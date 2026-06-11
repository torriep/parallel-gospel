import { create } from 'zustand';
import type { GospelKey } from '../lib/types';
import { db } from '../lib/db';

interface AppState {
  isDarkMode: boolean;
  fontDelta: number;          // delta (in pt) from the system base size — replaces absolute fontSize
  systemFontBase: number;     // detected system base size (default 17pt, Apple HIG body)
  showDifferences: boolean;
  secondaryTranslation: string | null;
  lastScrollPosition: number;

  // UI panels
  openPicker: GospelKey | null;
  showTranslationPicker: boolean;
  showSearch: boolean;
  showBookmarks: boolean;
  showPericopes: boolean;
  showReadingPlans: boolean;
  showSettings: boolean;
  showSidebar: boolean;          // drawer state for compact widths; on regular widths the sidebar is always shown
  focusRowId: number | null;
  highlightedRowId: number | null;
  currentRowId: number;
  // First/last row ids currently within the reading viewport. Drives the
  // GospelXray "you-are-here" band so it shows exactly what is on screen.
  // Tracked separately from currentRowId (which is a single top-of-viewport
  // scroll-spy value used for the sidebar highlight).
  visibleFirstRowId: number | null;
  visibleLastRowId: number | null;
  // True while a programmatic (x-ray-initiated) scroll is in flight. The x-ray
  // band freezes while this is true and resumes tracking the viewport once the
  // scroll has actually settled.
  isAutoScrolling: boolean;
  currentRefs: Record<GospelKey, string | null>;

  // Actions
  toggleDarkMode: () => void;
  setFontDelta: (d: number) => void;
  setSystemFontBase: (base: number) => void;
  toggleDifferences: () => void;
  setSecondaryTranslation: (t: string | null) => void;
  setLastScrollPosition: (pos: number) => void;
  setOpenPicker: (key: GospelKey | null) => void;
  setShowTranslationPicker: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowBookmarks: (show: boolean) => void;
  setShowPericopes: (show: boolean) => void;
  setShowReadingPlans: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowSidebar: (show: boolean) => void;
  setFocusRowId: (id: number | null) => void;
  setHighlightedRowId: (id: number | null) => void;
  setCurrentRowId: (id: number) => void;
  setVisibleRange: (first: number | null, last: number | null) => void;
  setAutoScrolling: (b: boolean) => void;
  setCurrentRefs: (refs: Record<GospelKey, string | null>) => void;
  loadSettings: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDarkMode: false,
  fontDelta: 0,
  systemFontBase: 17,
  showDifferences: false,
  secondaryTranslation: null,
  lastScrollPosition: 0,

  openPicker: null,
  showTranslationPicker: false,
  showSearch: false,
  showBookmarks: false,
  showPericopes: false,
  showReadingPlans: false,
  showSettings: false,
  // Width-aware default: visible on iPad regular width, closed drawer on iPhone compact width.
  showSidebar: typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  focusRowId: null,
  highlightedRowId: null,
  currentRowId: 1,
  visibleFirstRowId: null,
  visibleLastRowId: null,
  isAutoScrolling: false,
  currentRefs: { MT: null, MC: null, LC: null, JN: null },

  toggleDarkMode: () => {
    const newVal = !get().isDarkMode;
    set({ isDarkMode: newVal });
    db.settings.put({ id: 'isDarkMode', value: JSON.stringify(newVal) });
  },

  setFontDelta: (d: number) => {
    const clamped = Math.max(-4, Math.min(10, d));
    set({ fontDelta: clamped });
    db.settings.put({ id: 'fontDelta', value: JSON.stringify(clamped) });
  },

  setSystemFontBase: (base: number) => set({ systemFontBase: base }),

  toggleDifferences: () => set(s => ({ showDifferences: !s.showDifferences })),
  setSecondaryTranslation: (t) => {
    set({ secondaryTranslation: t });
    db.settings.put({ id: 'secondaryTranslation', value: JSON.stringify(t) });
  },
  setLastScrollPosition: (pos) => set({ lastScrollPosition: pos }),
  setOpenPicker: (key) => set({ openPicker: key, showTranslationPicker: false, showSettings: false }),
  setShowTranslationPicker: (show) => set({ showTranslationPicker: show, openPicker: null }),
  setShowSearch: (show) => set({ showSearch: show }),
  setShowBookmarks: (show) => set({ showBookmarks: show }),
  setShowPericopes: () => set(s => ({ showPericopes: !s.showPericopes })),
  setShowReadingPlans: (show) => set({ showReadingPlans: show }),
  setShowSettings: (show) => set({ showSettings: show, openPicker: null }),
  setShowSidebar: (show) => set({ showSidebar: show }),
  setFocusRowId: (id) => set({ focusRowId: id }),
  setHighlightedRowId: (id) => set({ highlightedRowId: id }),
  setCurrentRowId: (id) => set({ currentRowId: id }),
  setVisibleRange: (first, last) => set(s =>
    s.visibleFirstRowId === first && s.visibleLastRowId === last
      ? s
      : { visibleFirstRowId: first, visibleLastRowId: last }
  ),
  setAutoScrolling: (b) => set(s => s.isAutoScrolling === b ? s : { isAutoScrolling: b }),
  setCurrentRefs: (refs) => set({ currentRefs: refs }),

  loadSettings: async () => {
    try {
      const settings = await db.settings.toArray();
      const updates: Partial<AppState> = {};
      for (const s of settings) {
        const val = JSON.parse(s.value);
        if (s.id === 'isDarkMode') updates.isDarkMode = val;
        if (s.id === 'fontDelta') updates.fontDelta = val;
        if (s.id === 'secondaryTranslation') updates.secondaryTranslation = val;
        if (s.id === 'lastScrollPosition') updates.lastScrollPosition = val;
      }
      set(updates);
    } catch {
      // First load, no settings yet
    }
  },
}));
