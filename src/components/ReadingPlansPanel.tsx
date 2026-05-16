import { useUserDataStore } from '../stores/userDataStore';
import type { Theme } from '../lib/theme';
import type { ReadingPlan } from '../lib/types';

const READING_PLANS: ReadingPlan[] = [
  { id: 'passion-week', name: 'Semaine de la Passion', days: 7, pericopes: ['montee-jerusalem', 'entree-triomphale', 'derniere-cene', 'arrestation', 'crucifixion', 'resurrection', 'apparitions'] },
  { id: 'miracles', name: 'Miracles de Jésus', days: 14, pericopes: ['cana', 'guerisons', 'multiplication-pains'] },
  { id: 'parables', name: 'Paraboles', days: 10, pericopes: ['paraboles', 'sermon-montagne'] },
  { id: 'full-read', name: 'Lecture complète', days: 90, pericopes: [] },
];

interface ReadingPlansPanelProps {
  onClose: () => void;
  theme: Theme;
}

export function ReadingPlansPanel({ onClose, theme }: ReadingPlansPanelProps) {
  const { activePlan, setActivePlan } = useUserDataStore();

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: theme.bg, zIndex: 400, display: 'flex', flexDirection: 'column',
      fontFamily: "'Palatino Linotype', serif",
    }}>
      <div style={{
        padding: '12px 16px', background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Plans de lecture</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: theme.textMuted, fontFamily: 'inherit',
          }}
        >Fermer</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {READING_PLANS.map(plan => {
          const isActive = activePlan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setActivePlan(isActive ? null : plan.id)}
              style={{
                display: 'block', width: '100%', padding: 16, marginBottom: 8,
                border: `2px solid ${isActive ? theme.gospelColors.LC : theme.border}`,
                borderRadius: 10,
                background: isActive ? `${theme.gospelColors.LC}10` : theme.card,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                {plan.days} jours &middot; {plan.pericopes.length || 'toutes les'} sections
              </div>
              {isActive && (
                <div style={{
                  marginTop: 8, fontSize: 11, color: theme.gospelColors.LC, fontWeight: 600,
                }}>
                  Plan actif
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
