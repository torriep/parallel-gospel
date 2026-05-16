# Kill duplicate search entries

## What we're building
Remove the two extra search entry points so the top-bar 🔍 is the only one.

## Why
Pierre sees three magnifiers in the app. Single entry, single mental model — Goodwin/Cooper goal-directed. The top-bar 🔍 was meant to be the only search entry.

## Product concepts touched
Sidebar, status bar.

## Key decisions
1. **Sidebar.tsx**: remove the `<button>` that contains `<SearchIcon>` + `Rechercher` (around line 85-91). It's in the "Shortcuts" section right after the pericope list. The Signets shortcut stays.
2. **StatusBar.tsx**: remove the SearchIcon button (around line 71-75). The status bar keeps its progress text and other secondary controls.
3. **Drop the import of `SearchIcon`** from both files if it becomes unused. Don't leave unused imports.
4. **Do not change TopChrome.tsx** — its 🔍 button is the one true search entry and stays.

## Out of scope
- Don't redesign the sidebar shortcuts section beyond removing this one button.
- Don't touch SearchPanel.tsx — the magnifier glyph inside its own input is correct and stays.
