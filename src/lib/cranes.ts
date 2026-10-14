// 검토 계산에 쓰는 장비: 카탈로그 중 하중표가 등록된 기종.
//
// 하중표는 제조사 공식 PDF에서 글자를 뽑아 다시 맞춘 것이다. verify 표시 행(대략 반경 8m 이상)은
// 칸 정렬이 확실하지 않아, 그 칸을 쓴 결과에는 "원본 대조 필요"를 붙인다.
// 붐 피벗 높이와 붐 각도 범위는 제원표에 없어 가정값을 쓴다 (assumed 에 기록).
import { CATALOG, CatalogChart, CatalogEntry, firstNumber, makerLabel } from './catalog';

export type LoadChartRow = {
  /** 붐 길이 (m) */
  boomLength: number;
  /** [작업반경(m), 정격하중(t)] 쌍. 반경 오름차순. */
  capacities: [number, number][];
  /** 원본 대조가 필요한 반경 (m) */
  unverified?: number[];
};

export type Crane = {
  id: string;
  name: string;
  maker: string;
  model: string;
  /** 크레인 등급 (최대 정격하중, t) */
  classTon: number;
  /** 붐 길이 범위 (m) */
  boomMin: number;
  boomMax: number;
  /** 선회 중심에서 붐 피벗까지 높이 (m) */
  pivotHeight: number;
  /** 훅 블록 자중 (t). 하중률 계산 시 인양 하중에 더한다. */
  hookBlockWeight: number;
  /** 붐 각도 허용 범위 (도) */
  minAngle: number;
  maxAngle: number;
  /** 아웃리거 최대 확장 폭 (m) */
  outriggerSpan: number;
  /** 자체 중량 (t) */
  selfWeight: number;
  chart: LoadChartRow[];
  /** 하중표 출처 설명 */
  source: string;
  /** 하중표 원본 PDF */
  chartDoc?: string;
  /** 공식 제원표 PDF */
  specDoc?: string;
  /** 가정값을 쓴 항목 설명 */
  assumed: string[];
  sample: boolean;
};

/** 카탈로그 표(반경 행 × 붐 열)를 붐 길이별 행으로 바꾼다. 빈 칸은 뺀다. */
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

// 제원표에 없는 값. 훅 블록은 제원표의 주훅(용구 포함) 질량, 피벗 높이는 차체 높이 기준 가정.
const PARAMS: Record<string, { pivotHeight: number; hookBlockWeight: number }> = {
  'tadano-gr-160n': { pivotHeight: 1.9, hookBlockWeight: 0.14 },
  'tadano-gr-250n': { pivotHeight: 2.1, hookBlockWeight: 0.22 },
  'tadano-gr-350n': { pivotHeight: 2.2, hookBlockWeight: 0.31 },
  'tadano-gr-500n': { pivotHeight: 2.3, hookBlockWeight: 0.46 },
  'tadano-gr-700n': { pivotHeight: 2.4, hookBlockWeight: 0.34 },
};
const MIN_ANGLE = 15;
const MAX_ANGLE = 80;

export function toCrane(e: CatalogEntry): Crane | null {
  const p = PARAMS[e.id];
  if (!e.chart || !p) return null;
  const chart = chartToRows(e.chart);
  return {
    id: e.id,
    name: `${makerLabel(e.maker)} ${e.model}`,
    maker: e.maker,
    model: e.model,
    classTon: e.classTon,
    boomMin: chart[0].boomLength,
    boomMax: chart[chart.length - 1].boomLength,
    pivotHeight: p.pivotHeight,
    hookBlockWeight: p.hookBlockWeight,
    minAngle: MIN_ANGLE,
    maxAngle: MAX_ANGLE,
    outriggerSpan: firstNumber(e.outrigger) ?? 6,
    selfWeight: firstNumber(e.weight) ?? 0,
    chart,
    source: `${makerLabel(e.maker)} 공식 하중표 PDF 추출본 (주 붐, 아웃리거 최대, 360°)`,
    chartDoc: e.chartDoc,
    specDoc: e.sourceDoc,
    assumed: [`붐 피벗 높이 ${p.pivotHeight} m`, `붐 각도 ${MIN_ANGLE}~${MAX_ANGLE}°`],
    sample: false,
  };
}

export const CRANES: Crane[] = CATALOG.map(toCrane).filter((c): c is Crane => c !== null);

export function findCrane(id: string): Crane | undefined {
  return CRANES.find((c) => c.id === id);
}
