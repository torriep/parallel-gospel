import Dexie, { type EntityTable } from 'dexie';
import type { Highlight, Note, Bookmark } from './types';

interface ReadingPlanProgress {
  planId: string;
  completedSections: string[];
  lastReadRow: number;
  updatedAt: number;
}

interface AppSettingsRecord {
  id: string;
  value: string;
}

const db = new Dexie('EvangileParallele') as Dexie & {
  highlights: EntityTable<Highlight, 'ref'>;
  notes: EntityTable<Note, 'id'>;
  bookmarks: EntityTable<Bookmark, 'id'>;
  readingPlans: EntityTable<ReadingPlanProgress, 'planId'>;
  settings: EntityTable<AppSettingsRecord, 'id'>;
};

db.version(1).stores({
  highlights: 'ref, color, createdAt',
  notes: '++id, rowId, createdAt',
  bookmarks: '++id, rowId, createdAt',
  readingPlans: 'planId',
  settings: 'id',
});

export { db };
export type { ReadingPlanProgress, AppSettingsRecord };
