import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { TRANSLATIONS } from '../lib/types';
import type { Theme } from '../lib/theme';
import { useWidthClass } from '../hooks/useMediaQuery';
import { useFontScale } from '../hooks/useFontScale';
import { useT } from '../lib/i18n';
import {
  CloseIcon, DiffIcon, EyeOffIcon, EyeShowIcon, MinusIcon, MoonIcon, PlusIcon, SunIcon,
} from './icons';

interface SettingsPanelProps {
  theme: Theme;
  onClose: () => void;
}

export function SettingsPanel({ theme, onClose }: SettingsPanelProps) {
  const tr = useT();
  const fs = useFontScale();
  const widthClass = useWidthClass();
  const isCompact = widthClass === 'compact';

  const isDarkMode = useAppStore(s => s.isDarkMode);
  const toggleDarkMode = useAppStore(s => s.toggleDarkMode);
  const showDifferences = useAppStore(s => s.showDifferences);
  const toggleDifferences = useAppStore(s => s.toggleDifferences);
  const fontDelta = useAppStore(s => s.fontDelta);
  const setFontDelta = useAppStore(s => s.setFontDelta);
  const systemFontBase = useAppStore(s => s.systemFontBase);
  const secondaryTranslation = useAppStore(s => s.secondaryTranslation);
  const setSecondaryTranslation = useAppStore(s => s.setSecondaryTranslation);
  const renderAllMode = useAppStore(s => s.renderAllMode);
  const toggleRenderAllMode = useAppStore(s => s.toggleRenderAllMode);
  const { translationCode, loadTranslation, loadSecondaryTranslation } = useDataStore();

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  const handlePrimary = (code: string) => loadTranslation(code);
  const handleSecondary = (code: string | null) => {
    setSecondaryTranslation(code);
    loadSecondaryTranslation(code);
  };

  const content = (
    <>
      {/* Display block */}
      <SectionTitle theme={theme}>{tr('settings.display')}</SectionTitle>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexWrap: 'wrap' }}>
        <SegBtn theme={theme} active={showDifferences} onClick={toggleDifferences}>
          <DiffIcon size={18} color={showDifferences ? theme.gospelColors.MT : theme.textMuted} />
          <span>{tr('settings.parallels')}</span>
        </SegBtn>
        <SegBtn theme={theme} active={isDarkMode} onClick={toggleDarkMode}>
          {isDarkMode ? <SunIcon size={18} color={theme.text} /> : <MoonIcon size={18} color={theme.text} />}
          <span>{isDarkMode ? tr('settings.dayMode') : tr('settings.nightMode')}</span>
        </SegBtn>
      </div>

      <SectionTitle theme={theme}>{tr('settings.textSize')}</SectionTitle>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px 14px',
        }}
      >
        <button
          onClick={() => setFontDelta(fontDelta - 1)}
          style={roundBtn(theme)}
          aria-label={tr('settings.decrease')}
        >
          <MinusIcon size={18} color={theme.text} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: fs(13), color: theme.textMuted, marginBottom: 2 }}>
            {tr('settings.systemBase')} {systemFontBase}pt {fontDelta > 0 ? '+' : ''}{fontDelta !== 0 ? fontDelta : ''}
          </div>
          <div style={{ fontSize: systemFontBase + fontDelta, color: theme.text, lineHeight: 1.2 }}>
            Aa
          </div>
        </div>
        <button
          onClick={() => setFontDelta(fontDelta + 1)}
          style={roundBtn(theme)}
          aria-label={tr('settings.increase')}
        >
          <PlusIcon size={18} color={theme.text} />
        </button>
      </div>

      <SectionTitle theme={theme}>{tr('settings.primaryTranslation')}</SectionTitle>
      <div style={{ padding: '0 8px 8px' }}>
        {TRANSLATIONS.map(t => (
          <button
            key={t.code}
            onClick={() => handlePrimary(t.code)}
            style={{ ...rowBtn(theme, translationCode === t.code), fontSize: fs(14) }}
          >
            <EyeShowIcon size={16} color={translationCode === t.code ? theme.text : theme.textFaint} />
            <span style={{ flex: 1 }}>
              {t.name}
              <span style={{ fontSize: fs(11), marginLeft: 6, color: theme.textFaint }}>{t.language}</span>
            </span>
            {translationCode === t.code && (
              <span style={{ color: theme.gospelColors.LC, fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <SectionTitle theme={theme}>{tr('settings.comparativeTranslation')}</SectionTitle>
      <div style={{ padding: '0 8px 16px' }}>
        <button
          onClick={() => handleSecondary(null)}
          style={{ ...rowBtn(theme, !secondaryTranslation), fontSize: fs(14) }}
        >
          <EyeOffIcon size={16} color={!secondaryTranslation ? theme.text : theme.textFaint} />
          <span style={{ flex: 1 }}>{tr('settings.none')}</span>
          {!secondaryTranslation && (
            <span style={{ color: theme.gospelColors.LC, fontWeight: 700 }}>✓</span>
          )}
        </button>
        {TRANSLATIONS.filter(t => t.code !== translationCode).map(t => (
          <button
            key={t.code}
            onClick={() => handleSecondary(t.code)}
            style={{ ...rowBtn(theme, secondaryTranslation === t.code), fontSize: fs(14) }}
          >
            <EyeShowIcon size={16} color={secondaryTranslation === t.code ? theme.text : theme.textFaint} />
            <span style={{ flex: 1 }}>
              {t.name}
              <span style={{ fontSize: fs(11), marginLeft: 6, color: theme.textFaint }}>{t.language}</span>
            </span>
            {secondaryTranslation === t.code && (
              <span style={{ color: theme.gospelColors.LC, fontWeight: 700 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      {/* DEV-ONLY: force the renderer for testing both paths. In production the
          renderer is chosen automatically by device capability (content-visibility),
          so this toggle and the metrics HUD never ship to users. */}
      {import.meta.env.DEV && (
        <>
          <SectionTitle theme={theme}>{tr('settings.experimental')}</SectionTitle>
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
            <SegBtn theme={theme} active={renderAllMode} onClick={toggleRenderAllMode}>
              <DiffIcon size={18} color={renderAllMode ? theme.gospelColors.JN : theme.textMuted} />
              <span>{tr('settings.renderAll')}</span>
            </SegBtn>
          </div>
        </>
      )}

      {/* Translation credits / attributions. */}
      <div
        style={{
          padding: '6px 16px 0',
          fontSize: fs(11),
          lineHeight: 1.5,
          color: theme.textFaint,
          textAlign: 'center',
        }}
      >
        Scripture texts are public-domain editions, except the Lexham English Bible (LEB), © Logos Bible Software, used by permission.
      </div>

      {/* Build stamp — which exact code this build contains. */}
      <div
        style={{
          padding: '4px 16px 14px',
          fontSize: 11,
          color: theme.textFaint,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Build {__BUILD_COMMIT__} · {__BUILD_DATE__}
      </div>
    </>
  );

  if (isCompact) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 700,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end',
          animation: 'fadeIn 0.18s ease',
        }}
        onClick={onClose}
      >
        <div
          ref={ref}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxHeight: '85vh',
            background: theme.pickerBg,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Palatino Linotype', serif",
            animation: 'slideInBottom 0.24s ease',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
          }}
        >
          <div
            style={{
              display: 'flex', justifyContent: 'center', padding: '8px 0 4px',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.borderLight }} />
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 16px 8px',
            }}
          >
            <span style={{ fontSize: fs(17), fontWeight: 700, color: theme.text }}>{tr('settings.title')}</span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                minWidth: 44, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              aria-label={tr('sidebar.close')}
            >
              <CloseIcon size={20} color={theme.textMuted} />
            </button>
          </div>
          <div style={{ overflowY: 'auto' }}>{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 56,
        right: 12,
        zIndex: 200,
        width: 320,
        maxHeight: 'calc(100dvh - 80px)',
        overflowY: 'auto',
        background: theme.pickerBg,
        border: `0.5px solid ${theme.pickerBorder}`,
        borderRadius: 14,
        boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
        fontFamily: "'Palatino Linotype', serif",
        animation: 'scaleIn 0.16s ease',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: `0.5px solid ${theme.borderLight}`,
        }}
      >
        <span style={{ fontSize: fs(16), fontWeight: 700, color: theme.text }}>{tr('settings.title')}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            minWidth: 32, minHeight: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label={tr('sidebar.close')}
        >
          <CloseIcon size={18} color={theme.textMuted} />
        </button>
      </div>
      {content}
    </div>
  );
}

function SectionTitle({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const fs = useFontScale();
  return (
    <div
      style={{
        padding: '12px 16px 6px',
        fontSize: fs(11),
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: theme.textFaint,
      }}
    >
      {children}
    </div>
  );
}

function SegBtn(
  { theme, active, onClick, children }:
  { theme: Theme; active: boolean; onClick: () => void; children: React.ReactNode }
) {
  const fs = useFontScale();
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 14px',
        height: 44,
        minWidth: 44,
        background: active ? theme.highlight : theme.card,
        border: `0.5px solid ${active ? theme.gospelColors.LC : theme.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        color: theme.text,
        fontSize: fs(14),
        fontFamily: 'inherit',
        flex: 1,
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function roundBtn(theme: Theme): React.CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: `0.5px solid ${theme.border}`,
    background: theme.card,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

function rowBtn(theme: Theme, active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 12px',
    minHeight: 44,
    background: active ? theme.highlight : 'transparent',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    color: active ? theme.text : theme.textMuted,
    fontSize: 14,
    fontFamily: 'inherit',
    textAlign: 'left',
    fontWeight: active ? 600 : 400,
  };
}
