import { create } from 'zustand';
import { db } from '../lib/db';
import type { Highlight, Note, Bookmark } from '../lib/types';

interface UserDataState {
  highlights: Highlight[];
  notes: Note[];
  bookmarks: Bookmark[];
  activePlan: string | null;
  planProgress: Record<string, number>;

  loadAll: () => Promise<void>;
  addHighlight: (ref: string, color: string) => Promise<void>;
  removeHighlight: (ref: string) => Promise<void>;
  getHighlight: (ref: string) => Highlight | undefined;
  addNote: (rowId: number, text: string) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  addBookmark: (rowId: number, label: string) => Promise<void>;
  removeBookmark: (id: number) => Promise<void>;
  setActivePlan: (planId: string | null) => void;
}

export const useUserDataStore = create<UserDataState>((set, get) => ({
  highlights: [],
  notes: [],
  bookmarks: [],
  activePlan: null,
  planProgress: {},

  loadAll: async () => {
    const [highlights, notes, bookmarks] = await Promise.all([
      db.highlights.toArray(),
      db.notes.toArray(),
      db.bookmarks.toArray(),
    ]);
    set({ highlights, notes, bookmarks });
  },

  addHighlight: async (ref, color) => {
    const highlight: Highlight = { ref, color, createdAt: Date.now() };
    await db.highlights.put(highlight);
    set(s => ({
      highlights: [...s.highlights.filter(h => h.ref !== ref), highlight],
    }));
  },

  removeHighlight: async (ref) => {
    await db.highlights.delete(ref);
    set(s => ({
      highlights: s.highlights.filter(h => h.ref !== ref),
    }));
  },

  getHighlight: (ref) => {
    return get().highlights.find(h => h.ref === ref);
  },

  addNote: async (rowId, text) => {
    const note: Note = {
      rowId,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const id = await db.notes.add(note);
    set(s => ({
      notes: [...s.notes, { ...note, id: id as number }],
    }));
  },

  deleteNote: async (id) => {
    await db.notes.delete(id);
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
    }));
  },

  addBookmark: async (rowId, label) => {
    const bookmark: Bookmark = { rowId, label, createdAt: Date.now() };
    const id = await db.bookmarks.add(bookmark);
    set(s => ({
      bookmarks: [...s.bookmarks, { ...bookmark, id: id as number }],
    }));
  },

  removeBookmark: async (id) => {
    await db.bookmarks.delete(id);
    set(s => ({
      bookmarks: s.bookmarks.filter(b => b.id !== id),
    }));
  },

  setActivePlan: (planId) => set({ activePlan: planId }),
}));
