import { CRANES, Crane, LoadChartRow } from './cranes';
import { GroundCheck, groundCheck } from './ground';

export type LoadDims = { length: number; width: number; height: number };

export type ReviewInput = {
  siteName: string;
  /** Building height (m) */
  buildingHeight: number;
  /** Load weight (t) */
  loadWeight: number;
  /** Rigging gear weight (slings, shackles, etc.) (t) */
  riggingWeight: number;
  /** Horizontal distance from crane slew center to building outer wall (m) */
  setback: number;
  /** Working radius: horizontal distance from crane slew center to lift point (m). reach = working radius - setback */
  radius: number;
  /** Load dimensions. If absent, the default height allowance is used. */
  dims: LoadDims | null;
  /** Sling angle from horizontal (degrees) */
  slingAngle: number;
  /** Allowable ground bearing capacity (kN/m²) */
  groundBearing: number;
  /** Outrigger pad side length (m, square) */
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
  /** Boom angle from horizontal (degrees) */
  boomAngle: number;
  /** Boom tip height (m) */
  tipHeight: number;
  /** Boom tip height - building height (m) */
  topClearance: number;
  /** Perpendicular distance between the building edge and the boom (m) */
  wallClearance: number;
  /** Load chart row applied */
  chartBoomLength: number;
  chartRadius: number;
  /** Whether the applied load chart cell has been checked against the original */
  chartVerified: boolean;
  /** Rated capacity (t) */
  capacity: number;
  /** Load + rigging + hook block (t) */
  totalLoad: number;
  /** totalLoad / capacity */
  ratio: number;
  /** Simplified outrigger reaction / ground pressure check. null if crane weight is unknown */
  ground: GroundCheck | null;
};

export type Sling = {
  legLength: number;
  height: number;
  /** Tension per sling leg (t) */
  tension: number;
};

export type ReviewResult = {
  radius: number;
  /** Reach: building outer wall to lift point (m) */
  reach: number;
  requiredTipHeight: number;
  sling: Sling | null;
  evals: CraneEval[];
  /** Smallest crane with verdict '가능' (OK); if none, the smallest with '주의' (caution). */
  recommendedId: string | null;
};

/** Minimum clearance above the building top (m) */
export const ROOF_MARGIN = 1.0;
/** Hook block height + minimum hoisting allowance (m) */
export const HOOK_ALLOWANCE = 2.0;
/** Minimum distance between the building edge and the boom (m) */
export const MIN_WALL_CLEARANCE = 1.0;
/** Assumed load height + rigging height when dimensions are not entered (m) */
export const DEFAULT_LOAD_STACK = 2.5;
/** Load ratio caution threshold */
export const WARN_RATIO = 0.8;

const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

export function slingFor(dims: LoadDims | null, angleDeg: number, hookLoad: number): Sling | null {
  if (!dims) return null;
  const half = Math.max(dims.length, dims.width) / 2;
  const a = rad(angleDeg);
  // Based on 2 legs. Even with 4 legs, the load is not assumed to share evenly, so 2 legs are used.
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

/** Looks up rated capacity conservatively: the same-or-longer boom row and same-or-farther radius cell. */
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

  // Find the shortest boom length that meets the conditions, in 0.1 m steps.
  // If the load chart has no cell for that boom, use the next longer boom length that has one.
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

/** Fills defaults for fields missing from previously saved input. Older input stored reach instead of working radius. */
export function normalizeInput(i: Partial<ReviewInput> & { reach?: number }): ReviewInput {
  const { reach, ...rest } = i;
  const radius = rest.radius ?? (reach != null ? (rest.setback ?? DEFAULT_INPUT.setback) + reach : undefined);
  return { ...DEFAULT_INPUT, ...rest, ...(radius != null ? { radius } : {}) };
}

export const reachOf = (input: ReviewInput) => input.radius - input.setback;

/** Distance adjustment step (m) */
export const DIST_STEP = 0.5;
/** Setback upper limit (m) */
export const MAX_SETBACK = 40;

const snap = (v: number) => Math.round(v / DIST_STEP) * DIST_STEP;

/** Minimum setback for a crane with outriggers extended to sit against the wall: half the outrigger span + 1 m */
export const minSetback = (crane: Crane) => Math.max(3, Math.ceil((crane.outriggerSpan / 2 + 1) / DIST_STEP) * DIST_STEP);

/** Farthest radius in the load chart (m) */
export const maxChartRadius = (crane: Crane) => Math.max(...crane.chart.flatMap((r) => r.capacities.map(([x]) => x)));

export type Locks = { setback: boolean; radius: boolean };

/**
 * Max-distance auto-calc: the setback and working radius that let this crane lift farthest into the building (max reach).
 * Locked values are kept; only the rest are searched. Looks for verdict '가능' (OK) first, then allows '주의' (caution).
 * For equal reach, the shorter setback wins. null if nothing is found.
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
        // Stop once reach can no longer exceed the best found so far.
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

/** UP/DN: the next larger (+1) or smaller (-1) crane by class. null at either end. */
export function stepCrane(id: string | null, dir: 1 | -1, cranes: Crane[] = CRANES): Crane | null {
  const list = sortCranes(cranes);
  const i = list.findIndex((c) => c.id === id);
  if (i === -1) return list[dir === 1 ? 0 : list.length - 1] ?? null;
  return list[i + dir] ?? null;
}

export const sortCranes = (cranes: Crane[]) => [...cranes].sort((a, b) => a.classTon - b.classTon || a.name.localeCompare(b.name));
