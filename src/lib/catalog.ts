// 장비 카탈로그: 5개 제조사 200t 이하 기종의 기본 제원.
// 원본은 /mnt/project-files/catalog/cranes.json, scripts/sync-catalog.py 로 src/data 에 복사한다.
// 제원은 기종 비교·후보 선정용이다. 하중 계산에는 하중표(chart)가 있는 기종만 쓴다 (cranes.ts).
import raw from '../data/catalog.json';

export type Maker = 'Kato' | 'Liebherr' | 'Tadano' | 'Grove' | 'Kobelco';

export type CatalogChart = {
  /** 열: 주 붐 길이 (m) */
  boomLengths: number[];
  /** 행: 작업반경별 정격하중 (t). null 은 해당 붐에서 쓸 수 없는 반경. */
  rows: { radius: number; t: (number | null)[]; verify: boolean }[];
  /** 주훅 질량 (t, 용구 포함) */
  hookBlockT?: number;
  /** 하중표의 붐 각도 범위 (도) */
  angleRange?: [number, number];
  /** 정격 조건 (예: 360° 정격, 아웃리거 최대) */
  rating?: string;
  /** 판독 방법 */
  method?: string;
  /** 텔레스코핑 모드 처리 */
  modes?: string;
};

export type CatalogEntry = {
  id: string;
  maker: Maker;
  model: string;
  type: string;
  classTon: number;
  maxCap?: string;
  /** 주 붐 길이 [최소, 최대] (m). 단종 기종은 한쪽이 null 일 수 있다. */
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
  /** 제조사 현행 라인업 여부 */
  current: boolean;
  /** 공식 = 제조사 홈페이지·공식 제원표, 2차 = 제원 사이트 또는 모델명만 확인 */
  confidence: '공식' | '2차';
  source?: string;
  sourceUrl?: string;
  /** 공식 제원표 / 카탈로그 PDF */
  sourceDoc?: string;
  /** 하중표를 뽑은 원본 PDF */
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

/** 형식 필터. 'etc' 는 시티크레인 등 나머지. */
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

/** 필터 칩 옆 숫자: 해당 칸만 바꿨을 때 남는 기종 수 */
export function countWith<K extends keyof CatalogFilter>(list: CatalogEntry[], f: CatalogFilter, key: K, value: CatalogFilter[K]): number {
  return filterCatalog(list, { ...f, [key]: value }).length;
}

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

/** 붐 길이 범위 글. 한쪽 값만 있는 기종도 있다. */
export function boomText(b: CatalogEntry['boom']): string | undefined {
  if (!b || (b[0] == null && b[1] == null)) return undefined;
  return `${b[0] ?? ''}~${b[1] ?? ''}m`;
}

export const tonLabel = (t: number) => `${Number.isInteger(t) ? t : t.toFixed(1)}t`;

/** "최대 6.6 m", "19.795 t" 같은 글에서 첫 숫자를 꺼낸다. */
export function firstNumber(s: string | undefined): number | null {
  const m = s?.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}
