import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Theme } from '../lib/theme';

/**
 * EXPERIMENT (throwaway). Tiny on-screen readout for judging the render-all
 * experiment on a real iPad. Shows: build→paint time, DOM node count under the
 * grid, JS heap (Chrome only — Safari/WKWebView doesn't expose it), and a live
 * FPS meter (the number that matters most while scrolling). "Recount" re-reads
 * node count + heap on demand so the per-second reads don't skew the FPS.
 */
export function RenderMetricsHud({ theme }: { theme: Theme }) {
  const buildMs = useAppStore(s => s.renderAllBuildMs);
  const [fps, setFps] = useState(0);
  const [nodes, setNodes] = useState<number | null>(null);
  const [heapMB, setHeapMB] = useState<number | null>(null);

  // Live FPS via rAF (cheap; this is the headline scroll-smoothness signal).
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const recount = useCallback(() => {
    const scroller = document.querySelector('[data-grid-scroller]');
    setNodes(scroller ? scroller.querySelectorAll('*').length : null);
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    setHeapMB(mem ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : null);
  }, []);

  // First count shortly after the build time lands.
  const didInitial = useRef(false);
  useEffect(() => {
    if (buildMs != null && !didInitial.current) {
      didInitial.current = true;
      setTimeout(recount, 100);
    }
  }, [buildMs, recount]);

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 9000,
        background: theme.isDark ? 'rgba(20,20,22,0.92)' : 'rgba(255,255,255,0.94)',
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '8px 10px',
        font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
        minWidth: 150,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>RENDER-ALL · TEST</div>
      {row('build', buildMs != null ? `${Math.round(buildMs)} ms` : '…')}
      {row('nodes', nodes != null ? nodes.toLocaleString() : '—')}
      {row('heap', heapMB != null ? `${heapMB} MB` : 'n/a (iPad)')}
      {row('fps', `${fps}`)}
      <button
        onClick={recount}
        style={{
          marginTop: 6,
          width: '100%',
          padding: '4px 0',
          fontSize: 11,
          fontWeight: 700,
          color: theme.text,
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Recount
      </button>
    </div>
  );
}
