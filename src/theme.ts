// Lifting-plan brand tokens, per /mnt/project-files/branding/liftnote-brand-guide.md.
export const color = {
  yellow: '#FFC21A',
  yellowDeep: '#8A6200', // yellow-family text on a white background
  yellowSoft: '#FFF4CF',
  charcoal: '#2B2B2E',
  paper: '#FBF8F1',
  surface: '#FFFFFF',
  warm: '#8C857C',
  muted: '#6E6860',
  line: '#E8E1D2',
  ok: '#2F7D4F',
  warn: '#E06A10',
  no: '#C62828',
} as const;

export const font = {
  display: 'BlackHanSans_400Regular',
  body: 'IBMPlexSansKR_400Regular',
  medium: 'IBMPlexSansKR_500Medium',
  bold: 'IBMPlexSansKR_700Bold',
  mono: 'IBMPlexMono_500Medium',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16 } as const;

export const verdictColor = { ok: color.ok, warn: color.warn, no: color.no } as const;
