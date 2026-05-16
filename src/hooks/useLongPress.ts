import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, delay = 600) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  };
}
