# Highlight what's the same, not what's different

## What we're building
Flip the "Différences" feature: instead of highlighting words unique to each gospel, highlight words that appear across multiple gospels' versions of the same row. Rename the feature from "Différences" to "Parallèles" (or equivalent).

## Why
Pierre wants the reading aid to surface where the gospels AGREE — the shared text that signals a true parallel. Unique-word highlighting is the inverse and obscures the "bones" of the parallel.

## Product concepts touched
Differences/Parallèles toggle, diff helper, verse cell rendering, settings panel label.

## Key decisions
1. **`lib/diff.ts`**: add a `getCommonWords(row, gospelKey): Set<string>` helper. A word counts as "common" if its normalized form (lowercased, stripped of punctuation) appears in this cell's verse AND in at least one OTHER gospel's verse in the same row. The existing `getUniqueWords` can stay (might be useful for debug) but isn't used by the UI anymore.
2. **`VerseCell.tsx`**: when `showDifferences` is true, call `getCommonWords` instead of `getUniqueWords`. Highlight common words with the gospel color tint + dotted underline (same visual treatment, just inverted set). Non-common words render plain.
3. **Rename the toggle**:
   - The button label / tooltip: `Parallèles` (was `Différences`).
   - The store key stays `showDifferences` for now to avoid a wide refactor — only the user-facing copy changes.
   - The icon: keep `arrows-diff` for now — it still reads as "compare." We can iterate on the icon later.
4. **Settings panel copy**: wherever "Différences" appears in user-facing strings, replace with "Parallèles".

## Out of scope
- Don't rename the underlying state key (`showDifferences`) — UI label only.
- Don't add a second toggle for the old behavior. We're choosing one mode.
- No stemming or fuzzy matching — exact normalized match is enough for now.
