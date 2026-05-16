# Remove unique-verse pills

## What we're building
Remove the "Mt seul" / "Mc seul" / "Lc seul" / "Jn seul" pills (and any leftover "!" badges) from VerseCell and from FocusCard rows.

## Why
Pierre tested the redesign on iPad and judged the pills add visual noise without informational value. Column position + colored ref label already communicate gospel identity. Pills go.

## Product concepts touched
Verse cell rendering, focus card rendering.

## Key decisions
- Delete the unique-verse pill markup and any helper (e.g. `isUnique` check) used only for it.
- Keep the colored ref label (e.g. `LC 6:36` in red) — that's what carries gospel identity.
- Do not re-introduce a "this verse is unique to gospel X" indicator anywhere in the grid.
- If FocusCard has "absent" pills on dimmed cards for gospels with no parallel — those stay. Different concept, different purpose.

## Out of scope
Anything else.
