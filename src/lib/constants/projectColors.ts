export const VALID_PROJECT_COLORS = [
  'slate',
  'emerald',
  'blue',
  'amber',
  'rose',
  'violet',
] as const;

export type ProjectColor = (typeof VALID_PROJECT_COLORS)[number];

export interface ProjectColorTokens {
  id: ProjectColor;
  label: string;
  /** Solid swatch color used in the picker dot. */
  swatch: string;
  /** Foreground (icon/text) color used on tinted background — light mode. */
  tintLight: string;
  /** Tinted background — light mode. */
  tintBgLight: string;
  /** Foreground — dark mode. */
  tintDark: string;
  /** Tinted background — dark mode. */
  tintBgDark: string;
}

export const PROJECT_COLOR_OPTIONS: ProjectColorTokens[] = [
  {
    id: 'slate',
    label: 'Slate',
    swatch: '#2B2D42',
    tintLight: '#2B2D42',
    tintBgLight: 'rgba(43,45,66,0.08)',
    tintDark: '#cbd5e1',
    tintBgDark: 'rgba(203,213,225,0.10)',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#047857',
    tintLight: '#047857',
    tintBgLight: '#D1FAE5',
    tintDark: '#34d399',
    tintBgDark: 'rgba(52,211,153,0.14)',
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#1d4ed8',
    tintLight: '#1d4ed8',
    tintBgLight: '#DBEAFE',
    tintDark: '#60a5fa',
    tintBgDark: 'rgba(96,165,250,0.16)',
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#b45309',
    tintLight: '#b45309',
    tintBgLight: '#FEF3C7',
    tintDark: '#fbbf24',
    tintBgDark: 'rgba(251,191,36,0.14)',
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: '#be123c',
    tintLight: '#be123c',
    tintBgLight: '#FFE4E6',
    tintDark: '#fb7185',
    tintBgDark: 'rgba(251,113,133,0.14)',
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#6d28d9',
    tintLight: '#6d28d9',
    tintBgLight: '#EDE9FE',
    tintDark: '#a78bfa',
    tintBgDark: 'rgba(167,139,250,0.16)',
  },
];

const COLOR_MAP: Record<string, ProjectColorTokens> = Object.fromEntries(
  PROJECT_COLOR_OPTIONS.map((c) => [c.id, c])
);

export function getProjectColor(colorId?: string | null): ProjectColorTokens {
  if (!colorId) return COLOR_MAP.slate!;
  return COLOR_MAP[colorId] ?? COLOR_MAP.slate!;
}

/** Returns the right tint pair for the current theme mode. */
export function resolveColorTint(
  colorId: string | null | undefined,
  mode: 'light' | 'dark',
): { fg: string; bg: string } {
  const c = getProjectColor(colorId);
  return mode === 'dark'
    ? { fg: c.tintDark, bg: c.tintBgDark }
    : { fg: c.tintLight, bg: c.tintBgLight };
}
