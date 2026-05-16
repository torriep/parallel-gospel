# HIG redesign + TestFlight prep

## What we're building
Apply Apple HIG-aligned UI rework to the Parallel Gospel reader, then prep a TestFlight build for iPad.

## Why
The current UI stacks 5 horizontal chrome bands above the verse grid, has sub-44pt touch targets, a hardcoded 940px FocusCard that breaks on iPhone, and color-only gospel differentiation. Mockups for the new layout were reviewed in chat and are the source of truth — both iPad landscape and the iPad verse-picker popover are signed off.

## Product concepts touched
Pericope navigation, gospel column headers, verse picker, focus card, translation/settings, reading progress.

## User journeys affected
- Opening the app on iPad (sidebar + reading view)
- Tapping a gospel header to jump (popover with chapter + verse + parallel-sync hint)
- Tapping a verse row (focus card adaptive sheet)
- Switching translation / toggling differences / dark mode (now behind a single settings button)

## Key decisions
1. **Chrome reduction**: collapse TopBar + TimelineBar + ProgressBar + ColumnHeaders + hidden-cols strip + BottomBar into TopBar + breadcrumb + ColumnHeaders + slim status bar. Progress shown as text in status bar, not a separate bar.
2. **iPad sidebar**: 200px persistent left rail with pericope navigation grouped by phase (collapsible groups), search box, bookmark shortcut. Auto-collapses to drawer in portrait/compact width class.
3. **Header translucency**: `backdrop-filter: blur(20px)` over `rgba(250,246,238,0.82)`, replacing the solid brown gradient.
4. **Touch targets**: every interactive element ≥ 44pt on phone, ≥ 36pt acceptable for dense numeric pickers (verse-number tiles).
5. **Color-blind safety**: replace `!` unique badge with gospel monogram pill (`Mt seul`, `Mc seul`, etc.). Always present a gospel monogram next to the verse ref.
6. **Icon swaps**: Δ → `ti-arrows-diff`, ◉/○ → eye-show/eye-off, moon/sun stays.
7. **Verse picker** (tap any column header): popover on iPad anchored to header with up-chevron flip + pointer arrow; chapter grid (8 cols) then verse grid (10 cols) for selected chapter; footer line `Les trois autres évangiles se caleront sur le parallèle du rang choisi.`; bottom sheet on iPhone.
8. **FocusCard**: convert from fixed 940px modal to adaptive — bottom sheet (compact width) / centered card (regular). Surface bookmark + highlight as visible buttons. Show absent-gospel cards dimmed with "absent" pill instead of hiding.
9. **Dynamic Type**: read system text size on mount; custom font slider sets a delta from system size, not absolute pixels.
10. **Source of truth**: xlsx 11 (`Integrated Gospel 11 french.xlsx`) is now canonical. `parallel-gospel-FRLSG.json` is regenerated from it. `pericopes.json` now has 102 entries. Both already saved.

## Out of scope
- Regenerating the 6 other translation JSONs (ASV, BSB, DRB, KJV, WEB, YLT, FRDBY) — same swap logic applies but skip for this build; ship FRLSG-only and add others post-TestFlight.
- New phase taxonomy (5-phase ministère-galilée / ministère-judée split discussed but deferred).
- Audio, sharing, sync — none in this iteration.

## TestFlight steps (Pierre runs these after Claude Code finishes)
1. `npm run build`
2. `npx cap sync ios`
3. Open `ios/App/App.xcworkspace` in Xcode
4. Bump build number (Target → General → Build)
5. Product → Archive → Distribute → App Store Connect → Upload
6. Wait ~15 min for processing, then enable TestFlight build for internal testers
