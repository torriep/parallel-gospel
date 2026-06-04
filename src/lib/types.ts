export type GospelKey = 'MT' | 'MC' | 'LC' | 'JN';

export interface VerseData {
  ref: string;
  chapter: number;
  verse: number;
  text: string;
  span?: number;
}

export interface MergeInfo {
  merged_with_row: number;
  span_end_row: number;
}

export interface GospelRow {
  id: number;
  MT: VerseData | null;
  MC: VerseData | null;
  LC: VerseData | null;
  JN: VerseData | null;
  merges?: Partial<Record<GospelKey, MergeInfo>>;
}

export interface ChapterVerseIndex {
  first_row: number;
  verse_count: number;
  verses: Record<string, number>;
}

export interface ChapterIndex {
  MT: Record<string, ChapterVerseIndex>;
  MC: Record<string, ChapterVerseIndex>;
  LC: Record<string, ChapterVerseIndex>;
  JN: Record<string, ChapterVerseIndex>;
}

export interface TranslationData {
  translation: string;
  translation_full: string;
  total_rows: number;
  verse_counts: Record<GospelKey, number>;
  chapter_index: ChapterIndex;
  rows: GospelRow[];
}

export interface Highlight {
  ref: string;
  color: string;
  createdAt: number;
}

export interface Note {
  id?: number;
  rowId: number;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Bookmark {
  id?: number;
  rowId: number;
  label: string;
  createdAt: number;
}

export interface Pericope {
  id: string;
  /**
   * Bilingual title. The UI picks the right one via `useLanguage()` from
   * `lib/i18n`. Adding more languages later means adding more keys here.
   */
  label: { fr: string; en: string };
  phase: string;
  startRef: string;
  startRow?: number;
}

export type PhaseId = 'naissance' | 'ministere' | 'passion' | 'resurrection';

export interface TimelinePhase {
  id: PhaseId;
  /**
   * Fallback French label, kept on the struct for legibility / debug logs.
   * UI rendering should go through `useT()` with `phase.<id>` for translation.
   */
  label: string;
  icon: string;
  range: [number, number];
}

export interface ReadingPlan {
  id: string;
  name: string;
  days: number;
  pericopes: string[];
}

export interface TranslationInfo {
  code: string;
  name: string;
  language: string;
  file: string;
}

export const TIMELINE_PHASES: TimelinePhase[] = [
  { id: 'naissance', label: 'Naissance', icon: '★', range: [1, 99] },
  { id: 'ministere', label: 'Ministère', icon: '✦', range: [100, 1199] },
  { id: 'passion', label: 'Passion', icon: '✝', range: [1200, 2499] },
  { id: 'resurrection', label: 'Résurrection', icon: '☀', range: [2500, 2777] },
];

export const GOSPEL_KEYS: GospelKey[] = ['MT', 'MC', 'LC', 'JN'];
export const GOSPEL_NAMES: Record<GospelKey, string> = {
  MT: 'Matthieu',
  MC: 'Marc',
  LC: 'Luc',
  JN: 'Jean',
};
export const GOSPEL_MONOGRAMS: Record<GospelKey, string> = {
  MT: 'Mt',
  MC: 'Mc',
  LC: 'Lc',
  JN: 'Jn',
};

export const TRANSLATIONS: TranslationInfo[] = [
  { code: 'LSG', name: 'Louis Segond 1910', language: 'FR', file: 'parallel-gospel-LSG.json' },
  { code: 'FRLSG', name: 'Louis Segond (API)', language: 'FR', file: 'parallel-gospel-FRLSG.json' },
  { code: 'FRDBY', name: 'Bible Darby', language: 'FR', file: 'parallel-gospel-FRDBY.json' },
  { code: 'KJV', name: 'King James Version', language: 'EN', file: 'parallel-gospel-KJV.json' },
  { code: 'ASV', name: 'American Standard Version', language: 'EN', file: 'parallel-gospel-ASV.json' },
  { code: 'WEB', name: 'World English Bible', language: 'EN', file: 'parallel-gospel-WEB.json' },
  { code: 'YLT', name: "Young's Literal Translation", language: 'EN', file: 'parallel-gospel-YLT.json' },
  { code: 'DRB', name: 'Douay-Rheims Bible', language: 'EN', file: 'parallel-gospel-DRB.json' },
  { code: 'BSB', name: 'Berean Standard Bible', language: 'EN', file: 'parallel-gospel-BSB.json' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'Jaune', color: '#FFEAA7' },
  { name: 'Vert', color: '#B8E6C8' },
  { name: 'Bleu', color: '#B8D4E3' },
  { name: 'Rose', color: '#F5C6D0' },
  { name: 'Violet', color: '#D5B8E8' },
];

export const LIGHT_GOSPEL_COLORS: Record<GospelKey, string> = {
  MT: '#8B4513', MC: '#2F5233', LC: '#1B3A5C', JN: '#6B2D5B',
};

export const DARK_GOSPEL_COLORS: Record<GospelKey, string> = {
  MT: '#D4A574', MC: '#7CB88A', LC: '#6BA3D6', JN: '#C48DBF',
};
