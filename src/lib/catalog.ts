// Crane catalog: basic specs for models up to 200 t from 5 manufacturers.
// Source is /mnt/project-files/catalog/cranes.json, copied into src/data by scripts/sync-catalog.py.
// Specs are for comparing models and shortlisting. Load calculations use only models with a load chart (cranes.ts).
import raw from '../data/catalog.json';

export type Maker = 'Kato' | 'Liebherr' | 'Tadano' | 'Grove' | 'Kobelco';

export type CatalogChart = {
  /** Columns: main boom length (m) */
  boomLengths: number[];
  /** Rows: rated capacity per working radius (t). null means the radius is not usable with that boom. */
  rows: { radius: number; t: (number | null)[]; verify: boolean }[];
  /** Main hook mass (t, including fittings) */
  hookBlockT?: number;
  /** Boom angle range of the load chart (degrees) */
  angleRange?: [number, number];
  /** Rating conditions (e.g. 360° rating, outriggers fully extended) */
  rating?: string;
  /** How the values were read */
  method?: string;
  /** How telescoping modes are handled */
  modes?: string;
};

export type CatalogEntry = {
  id: string;
  maker: Maker;
  model: string;
  type: string;
  classTon: number;
  maxCap?: string;
  /** Main boom length [min, max] (m). Discontinued models may have one side null. */
  boom?: [number | null, number | null];
  jib?: string;
  hookHeight?: string;
  maxRadius?: string;
  outrigger?: string;
  size?: string;
  weight?: string;
  hookBlock?: string;
  axles?: number;
  engine?: string;
  /** Whether the model is in the manufacturer's current lineup */
  current: boolean;
  /** 공식 = manufacturer website or official spec sheet; 2차 = spec site, or model name only confirmed */
  confidence: '공식' | '2차';
  source?: string;
  sourceUrl?: string;
  /** Official spec sheet / catalog PDF */
  sourceDoc?: string;
  /** Source PDF the load chart was extracted from */
  chartDoc?: string;
  note?: string;
  chart?: CatalogChart;
};

export const CATALOG: CatalogEntry[] = (raw as unknown as { cranes: CatalogEntry[] }).cranes;
export const CATALOG_DATE: string = (raw as { collectedAt?: string }).collectedAt ?? '';

export const MAKERS: { key: Maker; label: string }[] = [
  { key: 'Kato', label: 'KATO' },
  { key: 'Liebherr', label: 'LIEBHERR' },
  { key: 'Tadano', label: 'TADANO' },
  { key: 'Grove', label: 'GROVE' },
  { key: 'Kobelco', label: 'KOBELCO' },
];

export const makerLabel = (m: string) => MAKERS.find((x) => x.key === m)?.label ?? m.toUpperCase();

/** Type filter. 'etc' covers city cranes and everything else. */
export const TYPES = [
  { key: 'all', label: '전체' },
  { key: '올터레인', label: '올터레인' },
  { key: '러프터레인', label: '러프터레인' },
  { key: '트럭크레인', label: '트럭' },
  { key: '크롤러', label: '크롤러' },
  { key: 'etc', label: '시티·기타' },
] as const;
const MAIN_TYPES = ['올터레인', '러프터레인', '트럭크레인', '크롤러'];

export const BANDS = [
  { key: 'all', label: '전체', min: 0, max: Infinity },
  { key: 'b1', label: '~25t', min: 0, max: 25.99 },
  { key: 'b2', label: '26~50t', min: 26, max: 50.99 },
  { key: 'b3', label: '51~100t', min: 51, max: 100.99 },
  { key: 'b4', label: '101~200t', min: 101, max: 200 },
] as const;

export type CatalogFilter = {
  maker: Maker | 'all';
  type: (typeof TYPES)[number]['key'];
  band: (typeof BANDS)[number]['key'];
  query: string;
  includeDiscontinued: boolean;
  chartOnly: boolean;
};

export const DEFAULT_FILTER: CatalogFilter = { maker: 'all', type: 'all', band: 'all', query: '', includeDiscontinued: true, chartOnly: false };

const squash = (s: string) => s.toLowerCase().replace(/[\s.\-_/()]/g, '');

export function matches(e: CatalogEntry, f: CatalogFilter): boolean {
  if (f.maker !== 'all' && e.maker !== f.maker) return false;
  if (f.type === 'etc' ? MAIN_TYPES.includes(e.type) : f.type !== 'all' && e.type !== f.type) return false;
  const band = BANDS.find((b) => b.key === f.band)!;
  if (e.classTon < band.min || e.classTon > band.max) return false;
  if (!f.includeDiscontinued && !e.current) return false;
  if (f.chartOnly && !e.chart) return false;
  const q = squash(f.query);
  if (q && !squash(`${e.maker}${makerLabel(e.maker)}${e.model}`).includes(q)) return false;
  return true;
}

export function filterCatalog(list: CatalogEntry[], f: CatalogFilter): CatalogEntry[] {
  return list.filter((e) => matches(e, f));
}

/** Count next to a filter chip: models remaining if only that filter changes */
export function countWith<K extends keyof CatalogFilter>(list: CatalogEntry[], f: CatalogFilter, key: K, value: CatalogFilter[K]): number {
  return filterCatalog(list, { ...f, [key]: value }).length;
}

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

/** Boom length range text. Some models have only one bound. */
export function boomText(b: CatalogEntry['boom']): string | undefined {
  if (!b || (b[0] == null && b[1] == null)) return undefined;
  return `${b[0] ?? ''}~${b[1] ?? ''}m`;
}

export const tonLabel = (t: number) => `${Number.isInteger(t) ? t : t.toFixed(1)}t`;

/** Extracts the first number from text like "최대 6.6 m" or "19.795 t". */
export function firstNumber(s: string | undefined): number | null {
  const m = s?.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}
