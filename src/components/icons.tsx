import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

function svg({ size = 20, color = 'currentColor', strokeWidth = 1.7, style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

export const SettingsIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <line x1="4" y1="6" x2="11" y2="6" />
      <line x1="15" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="9" y2="12" />
      <line x1="13" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="13" y2="18" />
      <line x1="17" y1="18" x2="20" y2="18" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="11" cy="12" r="2" />
      <circle cx="15" cy="18" r="2" />
    </>
  ) });

export const DiffIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <polyline points="8 4 4 8 8 12" />
      <line x1="4" y1="8" x2="14" y2="8" />
      <polyline points="16 12 20 16 16 20" />
      <line x1="10" y1="16" x2="20" y2="16" />
    </>
  ) });

export const EyeShowIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ) });

export const EyeOffIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A11.5 11.5 0 0 1 12 6c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.7 4.6" />
      <path d="M6.7 7.6A17.6 17.6 0 0 0 2 13s3.5 7 10 7a11.4 11.4 0 0 0 4.3-.8" />
      <path d="M14.1 14.1A3 3 0 0 1 9.9 9.9" />
    </>
  ) });

export const MoonIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  ) });

export const SunIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
    </>
  ) });

export const SearchIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </>
  ) });

export const BookmarkIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <path d="M6 3h12v18l-6-4-6 4z" />
  ) });

export const BookmarkFilledIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <path d="M6 3h12v18l-6-4-6 4z" fill={p.color ?? 'currentColor'} />
  ) });

export const HighlightIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <path d="M14 3l7 7-9 9H5v-7z" />
      <line x1="11" y1="6" x2="18" y2="13" />
    </>
  ) });

export const MenuIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ) });

export const CloseIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </>
  ) });

export const ChevronDownIcon = (p: IconProps) =>
  svg({ ...p, children: <polyline points="6 9 12 15 18 9" /> });

export const ChevronRightIcon = (p: IconProps) =>
  svg({ ...p, children: <polyline points="9 6 15 12 9 18" /> });

export const PlusIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ) });

export const MinusIcon = (p: IconProps) =>
  svg({ ...p, children: <line x1="5" y1="12" x2="19" y2="12" /> });

export const BookIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <>
      <path d="M4 4h7a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
      <path d="M20 4h-7a4 4 0 0 0-4 4v12h7a4 4 0 0 0 4-4z" />
    </>
  ) });

export const StarIcon = (p: IconProps) =>
  svg({ ...p, children: (
    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
  ) });
