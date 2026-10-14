// Simplified check of outrigger reaction and outrigger pad ground pressure.
//
// Max outrigger reaction is estimated with the rule of thumb "75% of (total crane weight + lifted load) bears on one outrigger".
// Actual reactions vary with slew direction, counterweight and outrigger span, so confirm with the manufacturer's reaction table
// or outrigger-reaction software.

/** Rule of thumb: max single-outrigger reaction = share × (crane weight + lifted load) */
export const REACTION_SHARE = 0.75;
/** Caution when ground pressure / allowable bearing capacity exceeds this */
export const GROUND_WARN_RATIO = 0.8;
const G = 9.80665;

export type GroundVerdict = 'ok' | 'warn' | 'no';

export type GroundCheck = {
  /** Estimated max reaction (t) */
  reaction: number;
  /** Estimated max reaction (kN) */
  reactionKN: number;
  /** Outrigger pad area (m²) */
  padArea: number;
  /** Ground pressure under the pad (kN/m²) */
  pressure: number;
  /** Allowable bearing capacity (kN/m²) */
  bearing: number;
  /** pressure / bearing */
  ratio: number;
  verdict: GroundVerdict;
  /** Minimum side of a square pad that stays within the allowable bearing capacity (m) */
  requiredPad: number;
};

/**
 * @param craneWeight crane weight (t)
 * @param hookLoad load + rigging + hook block (t)
 * @param bearing allowable bearing capacity (kN/m²)
 * @param padSize side of the square outrigger pad (m)
 */
export function groundCheck(craneWeight: number, hookLoad: number, bearing: number, padSize: number): GroundCheck | null {
  if (!(craneWeight > 0) || !(bearing > 0) || !(padSize > 0)) return null;
  const reaction = REACTION_SHARE * (craneWeight + hookLoad);
  const reactionKN = reaction * G;
  const padArea = padSize * padSize;
  const pressure = reactionKN / padArea;
  const ratio = pressure / bearing;
  const verdict: GroundVerdict = ratio > 1 ? 'no' : ratio > GROUND_WARN_RATIO ? 'warn' : 'ok';
  return { reaction, reactionKN, padArea, pressure, bearing, ratio, verdict, requiredPad: Math.sqrt(reactionKN / bearing) };
}

/** Reference allowable bearing capacities (kN/m²). Use site investigation or plate load test values when available. */
export const BEARING_PRESETS = [
  { label: '연약 점토·매립', value: 75 },
  { label: '보통 토사', value: 150 },
  { label: '다짐 자갈', value: 300 },
  { label: '암반·두꺼운 콘크리트', value: 600 },
];

export const PAD_PRESETS = [1.0, 1.2, 1.5, 2.0];
