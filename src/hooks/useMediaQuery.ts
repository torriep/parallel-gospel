import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Width class roughly mapping to Apple HIG's compact / regular size classes.
 * Regular = persistent sidebar visible, popovers anchored to headers, centered modals.
 * Compact = drawer, bottom sheets.
 */
export function useWidthClass(): 'compact' | 'regular' {
  const isRegular = useMediaQuery('(min-width: 768px)');
  return isRegular ? 'regular' : 'compact';
}
