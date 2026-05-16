import { useMemo } from 'react';
import { LIGHT_GOSPEL_COLORS, DARK_GOSPEL_COLORS, type GospelKey } from './types';

export interface Theme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textFaint: string;
  headerBg: string;
  sectionBg: string;
  pickerBg: string;
  pickerBorder: string;
  highlight: string;
  empty: string;
  gospelColors: Record<GospelKey, string>;
  isDark: boolean;
}

export function useTheme(isDark: boolean): Theme {
  return useMemo(() => isDark ? {
    bg: '#1A1612',
    surface: '#252019',
    surfaceAlt: '#2E2820',
    card: '#1F1B16',
    border: '#3D3529',
    borderLight: '#332D24',
    text: '#E8DCC8',
    textMuted: '#9B8E7A',
    textFaint: '#6B5F4F',
    headerBg: 'linear-gradient(180deg, #2A2118 0%, #1A1410 100%)',
    sectionBg: 'linear-gradient(90deg, #2E2820 0%, #332D24 50%, #2E2820 100%)',
    pickerBg: '#252019',
    pickerBorder: '#4A3F32',
    highlight: '#3D3020',
    empty: '#1E1A14',
    gospelColors: DARK_GOSPEL_COLORS,
    isDark: true,
  } : {
    bg: '#FAF6EE',
    surface: '#F5EDE0',
    surfaceAlt: '#FDF8F0',
    card: '#FFFDF7',
    border: '#D4C5A9',
    borderLight: '#EDE8DC',
    text: '#2C2416',
    textMuted: '#8B7355',
    textFaint: '#A09080',
    headerBg: 'linear-gradient(180deg, #5C3D1A 0%, #3E2710 100%)',
    sectionBg: 'linear-gradient(90deg, #EDE3D0 0%, #F5EDE0 50%, #EDE3D0 100%)',
    pickerBg: '#FDF8F0',
    pickerBorder: '#C4A265',
    highlight: '#FFF3D0',
    empty: '#F8F4EC',
    gospelColors: LIGHT_GOSPEL_COLORS,
    isDark: false,
  }, [isDark]);
}
