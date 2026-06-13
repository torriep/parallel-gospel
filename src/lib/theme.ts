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
    bg: '#161618',
    surface: '#1F1F22',
    surfaceAlt: '#26262A',
    card: '#1B1B1E',
    border: '#34343A',
    borderLight: '#2A2A2F',
    text: '#ECEAE6',
    textMuted: '#A7A29B',
    textFaint: '#6E6A64',
    headerBg: 'linear-gradient(180deg, #5E1721 0%, #3E0F17 100%)',
    sectionBg: 'linear-gradient(90deg, #26262A 0%, #2C2C31 50%, #26262A 100%)',
    pickerBg: '#1F1F22',
    pickerBorder: '#7A2730',
    highlight: '#3A1E22',
    empty: '#19191B',
    gospelColors: DARK_GOSPEL_COLORS,
    isDark: true,
  } : {
    bg: '#FFFFFF',
    surface: '#F7F6F4',
    surfaceAlt: '#FBFAF9',
    card: '#FFFFFF',
    border: '#E3E0DB',
    borderLight: '#EFEEEB',
    text: '#1F1F1F',
    textMuted: '#6A6660',
    textFaint: '#9B968F',
    headerBg: 'linear-gradient(180deg, #8A2230 0%, #5E1721 100%)',
    sectionBg: 'linear-gradient(90deg, #F2EFEA 0%, #F7F6F4 50%, #F2EFEA 100%)',
    pickerBg: '#FFFFFF',
    pickerBorder: '#9A3A45',
    highlight: '#F6E7E9',
    empty: '#FBFBFA',
    gospelColors: LIGHT_GOSPEL_COLORS,
    isDark: false,
  }, [isDark]);
}
