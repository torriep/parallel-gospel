import { create } from 'zustand';

/**
 * App language. Follows the device language at startup (Apple HIG idiom):
 *   navigator.language starts with "fr" → 'fr'
 *   anything else                       → 'en' (fallback)
 *
 * No in-app toggle; the user changes their device language in Settings →
 * General → Language & Region. A dev override is available via the URL
 * query string `?lang=en` or `?lang=fr` (useful for QA inside the webview).
 */
export type Language = 'fr' | 'en';

export function detectDeviceLanguage(): Language {
  if (typeof window === 'undefined') return 'fr';

  // Dev/QA override: ?lang=en or ?lang=fr in the URL.
  try {
    const override = new URLSearchParams(window.location.search).get('lang');
    if (override === 'fr' || override === 'en') return override;
  } catch {
    // ignore — URLSearchParams may not exist in some early webview states
  }

  const lang = (navigator?.language ?? 'fr').toLowerCase();
  return lang.startsWith('fr') ? 'fr' : 'en';
}

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nState>(set => ({
  language: detectDeviceLanguage(),
  setLanguage: (lang: Language) => set({ language: lang }),
}));

/**
 * The bilingual string table. Each key maps to a French + English variant.
 * Add new keys here as components are migrated off hard-coded strings.
 *
 * Naming convention: dot-separated namespace, e.g. `settings.darkMode`.
 */
const STRINGS = {
  // Timeline phases (used in sidebar grouping)
  'phase.naissance':    { fr: 'Naissance',    en: 'Birth' },
  'phase.ministere':    { fr: 'Ministère',    en: 'Ministry' },
  'phase.passion':      { fr: 'Passion',      en: 'Passion' },
  'phase.resurrection': { fr: 'Résurrection', en: 'Resurrection' },

  // Gospel names (column headers + aria-labels)
  'gospel.MT': { fr: 'Matthieu', en: 'Matthew' },
  'gospel.MC': { fr: 'Marc',     en: 'Mark' },
  'gospel.LC': { fr: 'Luc',      en: 'Luke' },
  'gospel.JN': { fr: 'Jean',     en: 'John' },

  // Highlight colors
  'color.yellow': { fr: 'Jaune',  en: 'Yellow' },
  'color.green':  { fr: 'Vert',   en: 'Green' },
  'color.blue':   { fr: 'Bleu',   en: 'Blue' },
  'color.pink':   { fr: 'Rose',   en: 'Pink' },
  'color.purple': { fr: 'Violet', en: 'Purple' },

  // Top chrome
  'top.search':   { fr: 'Rechercher', en: 'Search' },
  'top.settings': { fr: 'Réglages',   en: 'Settings' },

  // Sidebar
  'sidebar.navigation':    { fr: 'Navigation',  en: 'Navigation' },
  'sidebar.close':         { fr: 'Fermer',      en: 'Close' },
  'sidebar.bookmarks':     { fr: 'Signets',     en: 'Bookmarks' },
  'sidebar.pericopeCount': { fr: 'péricopes',   en: 'pericopes' },

  // Gospel x-ray (overview strip)
  'xray.label': { fr: 'Aperçu de la concordance — toucher ou glisser pour naviguer', en: 'Harmony overview — tap or drag to navigate' },

  // Settings panel
  'settings.title':                { fr: 'Réglages',                en: 'Settings' },
  'settings.display':              { fr: 'Affichage',               en: 'Display' },
  'settings.parallels':            { fr: 'Parallèles',              en: 'Parallels' },
  'settings.dayMode':              { fr: 'Mode jour',               en: 'Light mode' },
  'settings.nightMode':            { fr: 'Mode nuit',               en: 'Dark mode' },
  'settings.textSize':             { fr: 'Taille du texte',         en: 'Text size' },
  'settings.decrease':             { fr: 'Diminuer',                en: 'Decrease' },
  'settings.increase':             { fr: 'Augmenter',               en: 'Increase' },
  'settings.systemBase':           { fr: 'Base système',            en: 'System base' },
  'settings.primaryTranslation':   { fr: 'Traduction principale',   en: 'Primary translation' },
  'settings.comparativeTranslation': { fr: 'Traduction comparative', en: 'Comparative translation' },
  'settings.none':                 { fr: 'Aucune',                  en: 'None' },

  // Search panel
  'search.placeholder':   { fr: 'Rechercher une péricope ou un mot...', en: 'Search a pericope or a word...' },
  'search.cancel':        { fr: 'Annuler',                              en: 'Cancel' },
  'search.hint':          { fr: 'Cherchez une péricope ou un mot dans les versets.', en: 'Search a pericope or a word in the verses.' },
  'search.noResults':     { fr: 'Aucun résultat pour',                  en: 'No results for' },
  'search.pericopes':     { fr: 'Péricopes',                            en: 'Pericopes' },
  'search.verses':        { fr: 'Versets',                              en: 'Verses' },
  'search.unique':        { fr: 'unique',                               en: 'unique' },
  'search.gospelCount':   { fr: 'évangiles',                            en: 'gospels' },

  // Bookmarks panel
  'bookmarks.title':   { fr: 'Signets', en: 'Bookmarks' },
  'bookmarks.close':   { fr: 'Fermer',  en: 'Close' },
  'bookmarks.empty':   { fr: 'Aucun signet. Appuyez longuement sur un verset pour en ajouter.', en: 'No bookmarks. Long-press a verse to add one.' },

  // Reading plans
  'plans.title':           { fr: 'Plans de lecture',     en: 'Reading plans' },
  'plans.close':           { fr: 'Fermer',               en: 'Close' },
  'plans.passionWeek':     { fr: 'Semaine de la Passion', en: 'Passion Week' },
  'plans.miracles':        { fr: 'Miracles de Jésus',    en: 'Miracles of Jesus' },
  'plans.parables':        { fr: 'Paraboles',            en: 'Parables' },
  'plans.fullReading':     { fr: 'Lecture complète',     en: 'Full reading' },
  'plans.days':            { fr: 'jours',                en: 'days' },
  'plans.allSections':     { fr: 'toutes les',           en: 'all' },
  'plans.sections':        { fr: 'sections',             en: 'sections' },
  'plans.active':          { fr: 'Plan actif',           en: 'Active plan' },

  // Verse picker
  'picker.parallel':  { fr: 'Les trois autres évangiles se caleront sur le parallèle du rang choisi.', en: 'The other three Gospels will align with the parallel of the selected row.' },
  'picker.chapters':  { fr: 'Chapitres', en: 'Chapters' },
  'picker.close':     { fr: 'Fermer',    en: 'Close' },
  'picker.selectVerse': { fr: 'Choisir verset', en: 'Select verse' }, // aria-label prefix; gospel name appended

  // Status bar / loading
  'status.read':    { fr: 'lu',           en: 'read' },
  'app.loading':    { fr: 'Chargement...', en: 'Loading...' },

  // Focus card (verse detail view)
  'focus.parallel':       { fr: 'Parallèle',          en: 'Parallel' },
  'focus.gospelCount':    { fr: 'évangiles',          en: 'gospels' },
  'focus.removeBookmark': { fr: 'Retirer le signet',  en: 'Remove bookmark' },
  'focus.addBookmark':    { fr: 'Ajouter un signet',  en: 'Add bookmark' },
  'focus.close':          { fr: 'Fermer',             en: 'Close' },
  'focus.absent':         { fr: 'absent',             en: 'absent' },
  'focus.highlight':      { fr: 'Surligner',          en: 'Highlight' },
  'focus.clear':          { fr: 'Effacer',            en: 'Clear' },
  'focus.noParallel':     { fr: 'Aucun parallèle de', en: 'No parallel of' },
  'focus.atThisRow':      { fr: 'à ce rang.',         en: 'at this row.' },
  'focus.notes':          { fr: 'Notes personnelles', en: 'Personal notes' },
  'focus.notePlaceholder': { fr: 'Ajouter une note...', en: 'Add a note...' },
  'focus.delete':         { fr: 'Supprimer',          en: 'Delete' },
  'focus.add':            { fr: 'Ajouter',            en: 'Add' },
  'focus.row':            { fr: 'Rang',               en: 'Row' },
} as const;

export type StringKey = keyof typeof STRINGS;

/**
 * Resolve a key to the current UI language.
 * Use inside React via the `useT` hook so the component re-renders if
 * the language ever changes (e.g., via the QA URL override).
 */
export function t(key: StringKey, lang?: Language): string {
  const actualLang = lang ?? useI18nStore.getState().language;
  const entry = STRINGS[key];
  if (!entry) {
    // eslint-disable-next-line no-console
    console.warn(`[i18n] Missing key: ${key}`);
    return key;
  }
  return entry[actualLang] ?? entry.fr;
}

/**
 * React hook returning a translator bound to the current language.
 * Re-renders the component when the language changes.
 *
 *   const tr = useT();
 *   <span>{tr('settings.darkMode')}</span>
 */
export function useT(): (key: StringKey) => string {
  const language = useI18nStore(s => s.language);
  return (key: StringKey) => {
    const entry = STRINGS[key];
    if (!entry) {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Missing key: ${key}`);
      return key;
    }
    return entry[language] ?? entry.fr;
  };
}

/**
 * React hook returning the current language ('fr' or 'en').
 * Use when you need to branch on language directly (e.g., picking
 * the FR or EN field on a pericope object).
 */
export function useLanguage(): Language {
  return useI18nStore(s => s.language);
}
