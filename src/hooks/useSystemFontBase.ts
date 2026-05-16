import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * Resolve the browser's effective root font size and store it in appStore.
 * iOS Safari respects the user's preferred text size when `font: -apple-system-body`
 * is applied to an element — the computed pixel size of that element is the
 * Dynamic Type base. We measure it once on mount and on visibility change.
 */
export function useSystemFontBase() {
  const setSystemFontBase = useAppStore(s => s.setSystemFontBase);

  useEffect(() => {
    const probe = document.createElement('span');
    probe.style.cssText = `
      position: absolute; visibility: hidden;
      font: -apple-system-body;
    `;
    document.body.appendChild(probe);

    const measure = () => {
      const px = parseFloat(getComputedStyle(probe).fontSize);
      if (px && !Number.isNaN(px)) {
        setSystemFontBase(Math.round(px));
      }
    };
    measure();
    document.addEventListener('visibilitychange', measure);

    return () => {
      document.removeEventListener('visibilitychange', measure);
      probe.remove();
    };
  }, [setSystemFontBase]);
}
