import { create } from 'zustand';
import type { TranslationData, GospelRow, GospelKey, ChapterIndex, Pericope } from '../lib/types';
import { GOSPEL_KEYS } from '../lib/types';
import pericopesData from '../data/pericopes.json';

interface DataState {
  translationCode: string;
  translationData: TranslationData | null;
  secondaryData: TranslationData | null;
  rows: GospelRow[];
  chapterIndex: ChapterIndex | null;
  pericopes: (Pericope & { startRow: number })[];
  isLoading: boolean;

  loadTranslation: (code: string) => Promise<void>;
  loadSecondaryTranslation: (code: string | null) => Promise<void>;
  getRowIndexById: (id: number) => number;
  findRowByRef: (gospel: GospelKey, chapter: number, verse: number) => number | null;
}

const translationFiles: Record<string, () => Promise<TranslationData>> = {
  LSG: () => import('../data/parallel-gospel-LSG.json').then(m => m.default as unknown as TranslationData),
  FRLSG: () => import('../data/parallel-gospel-FRLSG.json').then(m => m.default as unknown as TranslationData),
  FRDBY: () => import('../data/parallel-gospel-FRDBY.json').then(m => m.default as unknown as TranslationData),
  KJV: () => import('../data/parallel-gospel-KJV.json').then(m => m.default as unknown as TranslationData),
  ASV: () => import('../data/parallel-gospel-ASV.json').then(m => m.default as unknown as TranslationData),
  WEB: () => import('../data/parallel-gospel-WEB.json').then(m => m.default as unknown as TranslationData),
  YLT: () => import('../data/parallel-gospel-YLT.json').then(m => m.default as unknown as TranslationData),
  DRB: () => import('../data/parallel-gospel-DRB.json').then(m => m.default as unknown as TranslationData),
  BSB: () => import('../data/parallel-gospel-BSB.json').then(m => m.default as unknown as TranslationData),
  DARBY: () => import('../data/parallel-gospel-DARBY.json').then(m => m.default as unknown as TranslationData),
  BBE: () => import('../data/parallel-gospel-BBE.json').then(m => m.default as unknown as TranslationData),
  NHEB: () => import('../data/parallel-gospel-NHEB.json').then(m => m.default as unknown as TranslationData),
  RNKJV: () => import('../data/parallel-gospel-RNKJV.json').then(m => m.default as unknown as TranslationData),
  LEB: () => import('../data/parallel-gospel-LEB.json').then(m => m.default as unknown as TranslationData),
};

function resolvePericopeRows(chapterIndex: ChapterIndex): (Pericope & { startRow: number })[] {
  return (pericopesData as Pericope[]).map(p => {
    const refMatch = p.startRef.match(/^([A-Z]{2})(\d+)\.(\d+)$/);
    if (!refMatch) return { ...p, startRow: 1 };
    const [, gospel, chapter, verse] = refMatch;
    const gKey = gospel as GospelKey;
    const chapterData = chapterIndex[gKey]?.[chapter];
    const rowId = chapterData?.verses?.[verse] ?? chapterData?.first_row ?? 1;
    return { ...p, startRow: rowId };
  }).sort((a, b) => a.startRow - b.startRow);
}

// Map from row id to index for fast lookup
let rowIdToIndex: Map<number, number> = new Map();

export const useDataStore = create<DataState>((set, get) => ({
  translationCode: 'KJV',
  translationData: null,
  secondaryData: null,
  rows: [],
  chapterIndex: null,
  pericopes: [],
  isLoading: true,

  loadTranslation: async (code: string) => {
    set({ isLoading: true });
    const loader = translationFiles[code];
    if (!loader) return;
    const data = await loader();
    rowIdToIndex = new Map(data.rows.map((r, i) => [r.id, i]));
    const pericopes = resolvePericopeRows(data.chapter_index);
    set({
      translationCode: code,
      translationData: data,
      rows: data.rows,
      chapterIndex: data.chapter_index,
      pericopes,
      isLoading: false,
    });
  },

  loadSecondaryTranslation: async (code: string | null) => {
    if (!code) {
      set({ secondaryData: null });
      return;
    }
    const loader = translationFiles[code];
    if (!loader) return;
    const data = await loader();
    set({ secondaryData: data });
  },

  getRowIndexById: (id: number) => {
    return rowIdToIndex.get(id) ?? -1;
  },

  findRowByRef: (gospel: GospelKey, chapter: number, verse: number) => {
    const ci = get().chapterIndex;
    if (!ci) return null;
    const chapterData = ci[gospel]?.[String(chapter)];
    if (!chapterData) return null;
    const rowId = chapterData.verses?.[String(verse)];
    if (rowId == null) return null;
    return rowId;
  },
}));
