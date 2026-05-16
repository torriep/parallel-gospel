import type { GospelRow, GospelKey } from './types';
import { GOSPEL_KEYS } from './types';

const PUNCT = /[.,;:!?'"()]/g;

function normalizeWords(text: string): string[] {
  return text.toLowerCase().replace(PUNCT, '').split(/\s+/);
}

// Words unique to this gospel on the row (kept for potential debug; UI uses getCommonWords).
export function getUniqueWords(row: GospelRow, gospelKey: GospelKey): Set<string> {
  const verse = row[gospelKey];
  if (!verse) return new Set();

  const thisWords = new Set(normalizeWords(verse.text).filter(w => w.length > 3));

  const otherWords = new Set<string>();
  for (const key of GOSPEL_KEYS) {
    if (key === gospelKey) continue;
    const other = row[key];
    if (!other) continue;
    for (const w of normalizeWords(other.text)) otherWords.add(w);
  }

  const unique = new Set<string>();
  for (const w of thisWords) {
    if (!otherWords.has(w)) unique.add(w);
  }
  return unique;
}

// Words this gospel shares with at least one other gospel's verse on the same row.
// Same length filter as getUniqueWords to skip articles/conjunctions that would otherwise clutter every cell.
export function getCommonWords(row: GospelRow, gospelKey: GospelKey): Set<string> {
  const verse = row[gospelKey];
  if (!verse) return new Set();

  const thisWords = new Set(normalizeWords(verse.text).filter(w => w.length > 3));

  const otherWords = new Set<string>();
  for (const key of GOSPEL_KEYS) {
    if (key === gospelKey) continue;
    const other = row[key];
    if (!other) continue;
    for (const w of normalizeWords(other.text)) otherWords.add(w);
  }

  const common = new Set<string>();
  for (const w of thisWords) {
    if (otherWords.has(w)) common.add(w);
  }
  return common;
}
