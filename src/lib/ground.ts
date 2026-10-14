// 아웃리거 반력과 받침판 접지압 간이 검토.
//
// 최대 아웃리거 반력은 "장비 총중량 + 인양 하중의 75%가 한 아웃리거에 걸린다"는 간이 법칙으로 추정한다.
// 실제 반력은 선회 방향, 카운터웨이트, 아웃리거 폭에 따라 달라지므로 제조사 반력표나
// 반력 계산 프로그램으로 확인해야 한다.

/** 간이 법칙: 최대 1개 아웃리거 반력 = 비율 × (장비 중량 + 인양 하중) */
export const REACTION_SHARE = 0.75;
/** 접지압 / 허용 지지력 이 값을 넘으면 주의 */
export const GROUND_WARN_RATIO = 0.8;
const G = 9.80665;

export type GroundVerdict = 'ok' | 'warn' | 'no';

export type GroundCheck = {
  /** 추정 최대 반력 (t) */
  reaction: number;
  /** 추정 최대 반력 (kN) */
  reactionKN: number;
  /** 받침판 면적 (m²) */
  padArea: number;
  /** 받침판 아래 접지압 (kN/m²) */
  pressure: number;
  /** 허용 지지력 (kN/m²) */
  bearing: number;
  /** pressure / bearing */
  ratio: number;
  verdict: GroundVerdict;
  /** 허용 지지력을 넘지 않는 정사각형 받침판 최소 한 변 (m) */
  requiredPad: number;
};

/**
 * @param craneWeight 장비 중량 (t)
 * @param hookLoad 자재 + 줄걸이 + 훅 블록 (t)
 * @param bearing 허용 지지력 (kN/m²)
 * @param padSize 정사각형 받침판 한 변 (m)
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

/** 허용 지지력 참고값 (kN/m²). 현장 지반조사나 평판재하시험 값이 있으면 그 값을 쓴다. */
export const BEARING_PRESETS = [
  { label: '연약 점토·매립', value: 75 },
  { label: '보통 토사', value: 150 },
  { label: '다짐 자갈', value: 300 },
  { label: '암반·두꺼운 콘크리트', value: 600 },
];

export const PAD_PRESETS = [1.0, 1.2, 1.5, 2.0];
