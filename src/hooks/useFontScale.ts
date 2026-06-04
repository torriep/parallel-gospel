import { useAppStore } from '../stores/appStore';

/**
 * Returns a scaling function for UI text sizes that respects the user's
 * text-size slider (fontDelta) the same way the verse text does.
 *
 * The factor is (systemFontBase + fontDelta) / systemFontBase, so:
 *   - at the default (fontDelta === 0) the factor is exactly 1.0 → the UI
 *     looks identical to before this hook existed, on any device.
 *   - as the slider grows/shrinks, every label scales proportionally.
 *
 * Usage: const fs = useFontScale();  ... fontSize: fs(14)
 *
 * Icons (which use a `size` prop, not fontSize), colored monogram/count
 * badges, and superscript verse numbers are intentionally left at fixed px.
 */
export function useFontScale() {
  const fontDelta = useAppStore(s => s.fontDelta);
  const systemFontBase = useAppStore(s => s.systemFontBase);
  const scale = (systemFontBase + fontDelta) / systemFontBase;
  return (px: number) => Math.round(px * scale * 100) / 100;
}
