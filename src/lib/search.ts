import type { GospelRow, GospelKey } from './types';
import { GOSPEL_KEYS } from './types';

export interface SearchResult {
  row: GospelRow;
  matches: { key: GospelKey; text: string; ref: string }[];
  gospelCount: number;
}

export function searchVerses(rows: GospelRow[], query: string, maxResults = 50): SearchResult[] {
  if (query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  const seen = new Set<number>();

  for (const row of rows) {
    const matches: SearchResult['matches'] = [];
    for (const key of GOSPEL_KEYS) {
      const verse = row[key];
      if (verse && verse.text.toLowerCase().includes(q)) {
        matches.push({ key, text: verse.text, ref: verse.ref });
      }
    }
    if (matches.length > 0 && !seen.has(row.id)) {
      seen.add(row.id);
      const gospelCount = GOSPEL_KEYS.filter(k => row[k]).length;
      results.push({ row, matches, gospelCount });
      if (results.length >= maxResults) break;
    }
  }
  return results;
}
