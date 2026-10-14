// Cranes used in review calculations: catalog models that have a registered load chart.
//
// Load charts are values that matched across two reads of the manufacturer's official PDF text; the column layout is reconstructed and not yet visually checked against the original. verify rows
// have uncertain cell alignment, so results that use those cells are flagged "원본 대조 필요".
// Boom pivot height and minimum boom angle are not in the spec sheets, so assumed values are used (recorded in assumed).
import { CATALOG, CatalogChart, CatalogEntry, firstNumber, makerLabel } from './catalog';

export type LoadChartRow = {
  /** Boom length (m) */
  boomLength: number;
  /** [working radius (m), rated capacity (t)] pairs, ascending by radius. */
  capacities: [number, number][];
  /** Radii that need checking against the original (m) */
  unverified?: number[];
};

export type Crane = {
  id: string;
  name: string;
  maker: string;
  model: string;
  /** Crane class (max rated capacity, t) */
  classTon: number;
  /** Boom length range (m) */
  boomMin: number;
  boomMax: number;
  /** Height from slew center to boom pivot (m) */
  pivotHeight: number;
  /** Hook block self-weight (t). Added to the lifted load when computing load ratio. */
  hookBlockWeight: number;
  /** Allowed boom angle range (degrees) */
  minAngle: number;
  maxAngle: number;
  /** Outrigger span at full extension (m) */
  outriggerSpan: number;
  /** Self-weight (t) */
  selfWeight: number;
  chart: LoadChartRow[];
  /** Load chart source description */
  source: string;
  /** Original load chart PDF */
  chartDoc?: string;
  /** Official spec sheet PDF */
  specDoc?: string;
  /** Overall length × width × height (catalog text as-is) */
  size?: string;
  /** Max rated capacity (catalog text, e.g. 25t @ 3.5m) */
  maxCap?: string;
  /** Load chart rating conditions (e.g. 360° rating, outriggers fully extended) */
  rating?: string;
  /** Descriptions of items that use assumed values */
  assumed: string[];
  sample: boolean;
};

/** Converts a catalog table (radius rows × boom columns) into rows per boom length. Empty cells are dropped. */
export function chartToRows(chart: CatalogChart): LoadChartRow[] {
  return chart.boomLengths.map((boomLength, j) => {
    const cells = chart.rows.filter((r) => r.t[j] != null).sort((a, b) => a.radius - b.radius);
    const unverified = cells.filter((r) => r.verify).map((r) => r.radius);
    return {
      boomLength,
      capacities: cells.map((r) => [r.radius, r.t[j] as number] as [number, number]),
      ...(unverified.length ? { unverified } : {}),
    };
  });
}

/** Practical minimum boom angle (an assumption kept separate from the load chart range) */
const MIN_ANGLE = 15;
const DEFAULT_MAX_ANGLE = 80;
/** Assumed boom pivot height: not in spec sheets, so estimated from crane class */
export const pivotEstimate = (classTon: number) => Math.round((1.8 + 0.008 * classTon) * 10) / 10;

export function toCrane(e: CatalogEntry): Crane | null {
  if (!e.chart || e.chart.boomLengths.length === 0) return null;
  const chart = chartToRows(e.chart);
  const pivotHeight = pivotEstimate(e.classTon);
  const maxAngle = e.chart.angleRange?.[1] ?? DEFAULT_MAX_ANGLE;
  const hook = e.chart.hookBlockT;
  const assumed = [`붐 피벗 높이 ${pivotHeight} m`, `최소 붐 각도 ${MIN_ANGLE}°`];
  if (!e.chart.angleRange) assumed.push(`최대 붐 각도 ${DEFAULT_MAX_ANGLE}°`);
  if (hook == null) assumed.push('훅 블록 질량 0.5 t');
  return {
    id: e.id,
    name: `${e.classTon}톤 크레인 (${makerLabel(e.maker)} ${e.model})`,
    maker: e.maker,
    model: e.model,
    classTon: e.classTon,
    boomMin: chart[0].boomLength,
    boomMax: chart[chart.length - 1].boomLength,
    pivotHeight,
    hookBlockWeight: hook ?? 0.5,
    minAngle: MIN_ANGLE,
    maxAngle,
    outriggerSpan: firstNumber(e.outrigger) ?? 6,
    selfWeight: firstNumber(e.weight) ?? 0,
    chart,
    source: `${makerLabel(e.maker)} 공식 하중표 PDF 판독값 (주 붐, ${e.chart.rating ?? '아웃리거 최대'})`,
    chartDoc: e.chartDoc,
    specDoc: e.sourceDoc,
    size: e.size,
    maxCap: e.maxCap,
    rating: e.chart.rating,
    assumed,
    sample: false,
  };
}

export const CRANES: Crane[] = CATALOG.map(toCrane).filter((c): c is Crane => c !== null);

export function findCrane(id: string): Crane | undefined {
  return CRANES.find((c) => c.id === id);
}
