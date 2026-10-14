import { CRANES, Crane, LoadChartRow } from './cranes';
import { GroundCheck, groundCheck } from './ground';

export type LoadDims = { length: number; width: number; height: number };

export type ReviewInput = {
  siteName: string;
  /** 건물 높이 (m) */
  buildingHeight: number;
  /** 자재 중량 (t) */
  loadWeight: number;
  /** 줄걸이 용구(슬링, 샤클 등) 중량 (t) */
  riggingWeight: number;
  /** 크레인 선회 중심 ~ 건물 외벽 수평거리 (m) */
  setback: number;
  /** 작업반경: 크레인 선회 중심 ~ 인양 지점 수평거리 (m). 도달거리 = 작업반경 - 이격거리 */
  radius: number;
  /** 자재 규격. 없으면 기본 높이 여유를 쓴다. */
  dims: LoadDims | null;
  /** 줄걸이 각도, 수평 기준 (도) */
  slingAngle: number;
  /** 지반 허용 지지력 (kN/m²) */
  groundBearing: number;
  /** 아웃리거 받침판 한 변 (m, 정사각형) */
  padSize: number;
};

export type Verdict = 'ok' | 'warn' | 'no';
export type FailReason = 'radius' | 'height' | 'clearance' | 'chart';

export type CraneEval = {
  crane: Crane;
  feasible: boolean;
  reason: FailReason | null;
  verdict: Verdict;
  boomLength: number;
  /** 붐 각도, 수평 기준 (도) */
  boomAngle: number;
  /** 붐 끝 높이 (m) */
  tipHeight: number;
  /** 붐 끝 높이 - 건물 높이 (m) */
  topClearance: number;
  /** 건물 모서리와 붐 사이 수직 거리 (m) */
  wallClearance: number;
  /** 적용한 하중표 행 */
  chartBoomLength: number;
  chartRadius: number;
  /** 적용한 하중표 칸이 원본 대조를 마친 값인지 */
  chartVerified: boolean;
  /** 정격하중 (t) */
  capacity: number;
  /** 자재 + 줄걸이 + 훅 블록 (t) */
  totalLoad: number;
  /** totalLoad / capacity */
  ratio: number;
  /** 아웃리거 반력·접지압 간이 검토. 장비 중량을 모르면 null */
  ground: GroundCheck | null;
};

export type Sling = {
  legLength: number;
  height: number;
  /** 1가닥 장력 (t) */
  tension: number;
};

export type ReviewResult = {
  radius: number;
  /** 도달거리: 건물 외벽 ~ 인양 지점 (m) */
  reach: number;
  requiredTipHeight: number;
  sling: Sling | null;
  evals: CraneEval[];
  /** 판정이 '가능'인 가장 작은 장비. 없으면 '주의' 중 가장 작은 장비. */
  recommendedId: string | null;
};

/** 건물 상단 위 최소 여유 (m) */
export const ROOF_MARGIN = 1.0;
/** 훅 블록 높이 + 최소 권상 여유 (m) */
export const HOOK_ALLOWANCE = 2.0;
/** 건물 모서리와 붐 사이 최소 거리 (m) */
export const MIN_WALL_CLEARANCE = 1.0;
/** 규격 미입력 시 자재 높이 + 줄걸이 높이 가정값 (m) */
export const DEFAULT_LOAD_STACK = 2.5;
/** 하중률 주의 기준 */
export const WARN_RATIO = 0.8;

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

export function slingFor(dims: LoadDims | null, angleDeg: number, hookLoad: number): Sling | null {
  if (!dims) return null;
  const half = Math.max(dims.length, dims.width) / 2;
  const a = rad(angleDeg);
  // 2가닥 기준. 4가닥이어도 하중이 고르게 걸린다고 보지 않고 2가닥으로 계산한다.
  return {
    legLength: half / Math.cos(a),
    height: half * Math.tan(a),
    tension: hookLoad / (2 * Math.sin(a)),
  };
}

export function requiredTipHeight(input: ReviewInput): number {
  const sling = slingFor(input.dims, input.slingAngle, 0);
  const stack = input.dims && sling ? input.dims.height + sling.height : DEFAULT_LOAD_STACK;
  return input.buildingHeight + ROOF_MARGIN + stack + HOOK_ALLOWANCE;
}

/** 하중표에서 보수적으로 정격하중을 찾는다: 같거나 긴 붐 행, 같거나 먼 반경 칸. */
export function lookupCapacity(
  chart: LoadChartRow[],
  boomLength: number,
  radius: number,
): { capacity: number; chartBoomLength: number; chartRadius: number; chartVerified: boolean } | null {
  const row = chart.find((r) => r.boomLength >= boomLength - 1e-9);
  if (!row) return null;
  const cell = row.capacities.find(([r]) => r >= radius - 1e-9);
  if (!cell) return null;
  const chartVerified = !(row.unverified ?? []).includes(cell[0]);
  return { capacity: cell[1], chartBoomLength: row.boomLength, chartRadius: cell[0], chartVerified };
}

type Geometry = { angle: number; tip: number; wallClearance: number };

function geometry(crane: Crane, L: number, R: number, setback: number, H: number): Geometry | null {
  if (L <= R) return null;
  const a = Math.acos(R / L);
  const tip = crane.pivotHeight + L * Math.sin(a);
  const atWall = crane.pivotHeight + setback * Math.tan(a);
  return { angle: deg(a), tip, wallClearance: (atWall - H) * Math.cos(a) };
}

export function evaluateCrane(crane: Crane, input: ReviewInput): CraneEval {
  const R = input.radius;
  const H = input.buildingHeight;
  const need = requiredTipHeight(input);
  const totalLoad = input.loadWeight + input.riggingWeight + crane.hookBlockWeight;

  const base = {
    crane,
    totalLoad,
    ground: groundCheck(crane.selfWeight, totalLoad, input.groundBearing, input.padSize),
    boomLength: crane.boomMax,
    boomAngle: 0,
    tipHeight: 0,
    topClearance: -H,
    wallClearance: 0,
    chartBoomLength: 0,
    chartRadius: 0,
    chartVerified: true,
    capacity: 0,
    ratio: Infinity,
  };

  // 조건을 만족하는 가장 짧은 붐 길이를 0.1m 단위로 찾는다.
  // 그 붐에 해당하는 하중표 칸이 없으면 더 긴 붐 중 하중표가 있는 길이를 쓴다.
  let found: { L: number; g: Geometry } | null = null;
  let cap: ReturnType<typeof lookupCapacity> = null;
  for (let L = crane.boomMin; L <= crane.boomMax + 1e-9; L = Math.round((L + 0.1) * 10) / 10) {
    const g = geometry(crane, L, R, input.setback, H);
    if (!g) continue;
    if (g.angle < crane.minAngle || g.angle > crane.maxAngle) continue;
    if (g.tip < need) continue;
    if (g.wallClearance < MIN_WALL_CLEARANCE) continue;
    found ??= { L, g };
    cap = lookupCapacity(crane.chart, L, R);
    if (cap) {
      found = { L, g };
      break;
    }
  }

  if (!found) {
    const g = geometry(crane, crane.boomMax, R, input.setback, H);
    let reason: FailReason;
    if (!g || g.angle < crane.minAngle) reason = 'radius';
    else if (g.tip < need) reason = 'height';
    else reason = 'clearance';
    return {
      ...base,
      feasible: false,
      reason,
      verdict: 'no',
      ...(g ? { boomAngle: g.angle, tipHeight: g.tip, topClearance: g.tip - H, wallClearance: g.wallClearance } : {}),
    };
  }

  const { L, g } = found;
  const geo = { boomLength: L, boomAngle: g.angle, tipHeight: g.tip, topClearance: g.tip - H, wallClearance: g.wallClearance };
  if (!cap) {
    return { ...base, ...geo, feasible: false, reason: 'chart', verdict: 'no' };
  }
  const ratio = totalLoad / cap.capacity;
  const verdict: Verdict = ratio > 1 ? 'no' : ratio > WARN_RATIO ? 'warn' : 'ok';
  return { ...base, ...geo, ...cap, ratio, feasible: true, reason: null, verdict };
}

export function review(input: ReviewInput, cranes: Crane[] = CRANES): ReviewResult {
  const evals = sortCranes(cranes).map((c) => evaluateCrane(c, input));
  const pick = evals.find((e) => e.verdict === 'ok') ?? evals.find((e) => e.verdict === 'warn') ?? null;
  return {
    radius: input.radius,
    reach: reachOf(input),
    requiredTipHeight: requiredTipHeight(input),
    sling: slingFor(input.dims, input.slingAngle, input.loadWeight + input.riggingWeight),
    evals,
    recommendedId: pick ? pick.crane.id : null,
  };
}

export const FAIL_LABEL: Record<FailReason, string> = {
  radius: '작업반경이 붐 길이를 넘음',
  height: '붐 끝 높이 부족',
  clearance: '건물 모서리와 붐 간섭',
  chart: '등록된 하중표에 해당 칸 없음',
};

export const VERDICT_LABEL: Record<Verdict, string> = { ok: '가능', warn: '주의', no: '불가' };

export const DEFAULT_INPUT: ReviewInput = {
  siteName: '',
  buildingHeight: 15,
  loadWeight: 1.0,
  riggingWeight: 0.05,
  setback: 8,
  radius: 14,
  dims: null,
  slingAngle: 60,
  groundBearing: 150,
  padSize: 1.2,
};

/** 예전에 저장한 입력에 새 항목이 없으면 기본값을 채운다. 예전 입력은 작업반경 대신 도달거리를 저장했다. */
export function normalizeInput(i: Partial<ReviewInput> & { reach?: number }): ReviewInput {
  const { reach, ...rest } = i;
  const radius = rest.radius ?? (reach != null ? (rest.setback ?? DEFAULT_INPUT.setback) + reach : undefined);
  return { ...DEFAULT_INPUT, ...rest, ...(radius != null ? { radius } : {}) };
}

export const reachOf = (input: ReviewInput) => input.radius - input.setback;

/** 거리 조정 단위 (m) */
export const DIST_STEP = 0.5;
/** 이격거리 상한 (m) */
export const MAX_SETBACK = 40;

const snap = (v: number) => Math.round(v / DIST_STEP) * DIST_STEP;

/** 아웃리거를 편 장비가 외벽에 붙을 수 있는 최소 이격거리: 아웃리거 폭의 절반 + 1m */
export const minSetback = (crane: Crane) => Math.max(3, Math.ceil((crane.outriggerSpan / 2 + 1) / DIST_STEP) * DIST_STEP);

/** 하중표의 가장 먼 반경 (m) */
export const maxChartRadius = (crane: Crane) => Math.max(...crane.chart.flatMap((r) => r.capacities.map(([x]) => x)));

export type Locks = { setback: boolean; radius: boolean };

/**
 * 최대거리 자동계산: 이 장비로 건물 안쪽 가장 먼 곳(도달거리 최대)까지 인양할 수 있는 이격거리·작업반경.
 * 고정(자물쇠)한 값은 그대로 두고 나머지만 찾는다. 판정 '가능'을 먼저 찾고, 없으면 '주의'까지 허용한다.
 * 같은 도달거리면 이격거리가 짧은 쪽을 고른다. 찾지 못하면 null.
 */
export function autoDistance(crane: Crane, input: ReviewInput, locks: Locks): { setback: number; radius: number; verdict: Verdict } | null {
  const maxR = maxChartRadius(crane);
  const setbacks: number[] = [];
  if (locks.setback) setbacks.push(input.setback);
  else for (let s = minSetback(crane); s <= Math.min(maxR, MAX_SETBACK) + 1e-9; s = snap(s + DIST_STEP)) setbacks.push(s);

  for (const accept of [['ok'], ['ok', 'warn']] as Verdict[][]) {
    let best: { setback: number; radius: number; verdict: Verdict } | null = null;
    for (const setback of setbacks) {
      const radii: number[] = [];
      if (locks.radius) {
        if (input.radius >= setback) radii.push(input.radius);
      } else {
        // 도달거리가 이미 찾은 값보다 길어질 수 없으면 더 볼 필요가 없다.
        if (best && maxR - setback <= best.radius - best.setback) break;
        for (let r = snap(Math.floor(maxR / DIST_STEP) * DIST_STEP); r >= setback - 1e-9; r = snap(r - DIST_STEP)) radii.push(r);
      }
      for (const radius of radii) {
        if (best && radius - setback <= best.radius - best.setback) break;
        const ev = evaluateCrane(crane, { ...input, setback, radius });
        if (accept.includes(ev.verdict)) {
          best = { setback, radius, verdict: ev.verdict };
          break;
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** UP/DN: 등급 순으로 한 단계 큰(+1) 또는 작은(-1) 장비. 끝이면 null. */
export function stepCrane(id: string | null, dir: 1 | -1, cranes: Crane[] = CRANES): Crane | null {
  const list = sortCranes(cranes);
  const i = list.findIndex((c) => c.id === id);
  if (i === -1) return list[dir === 1 ? 0 : list.length - 1] ?? null;
  return list[i + dir] ?? null;
}

export const sortCranes = (cranes: Crane[]) => [...cranes].sort((a, b) => a.classTon - b.classTon || a.name.localeCompare(b.name));
