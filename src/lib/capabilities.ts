// Runtime feature detection used to pick the verse renderer.
//
// VerseGridAll keeps the WHOLE harmony in the DOM and relies on CSS
// `content-visibility: auto` to skip layout/paint for off-screen rows. That
// property shipped in Safari / iPadOS 18. On iPadOS 17 and older it is simply
// ignored — which would make render-all paint every node fully (heavy, on the
// weakest devices). So where it is unsupported we fall back to the virtualized
// VerseGrid. Decided June 2026: keep both renderers, choose at runtime.
export const supportsContentVisibility =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('content-visibility', 'auto');
