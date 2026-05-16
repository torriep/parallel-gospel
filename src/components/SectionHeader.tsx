import type { Theme } from '../lib/theme';

export function SectionHeader({ label, theme }: { label: string; theme: Theme }) {
  return (
    <div style={{
      padding: '10px 16px',
      background: theme.sectionBg,
      textAlign: 'center',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <span style={{
        fontSize: '0.85em', fontWeight: 600, color: theme.textMuted,
        textTransform: 'uppercase', letterSpacing: 2,
      }}>
        {label}
      </span>
    </div>
  );
}
