// 장비 제원과 하중표.
//
// 주의: 아래 값은 화면과 계산 흐름을 개발하기 위한 샘플이다.
// 실제 제조사 하중표가 아니므로 현장 검토에 쓰면 안 된다.
// 실제 데이터로 바꿀 때는 source / version 을 함께 채운다.

export type LoadChartRow = {
  /** 붐 길이 (m) */
  boomLength: number;
  /** [작업반경(m), 정격하중(t)] 쌍. 반경 오름차순. */
  capacities: [number, number][];
};

export type Crane = {
  id: string;
  name: string;
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
  source: string;
  sample: boolean;
};

const SAMPLE_SOURCE = '샘플 하중표 (개발용, 실제 제원 아님)';

export const CRANES: Crane[] = [
  {
    id: 'sample-25',
    name: '이동식 25t (샘플)',
    classTon: 25,
    boomMin: 9.5,
    boomMax: 31,
    pivotHeight: 2.0,
    hookBlockWeight: 0.25,
    minAngle: 15,
    maxAngle: 80,
    outriggerSpan: 6.0,
    selfWeight: 26,
    source: SAMPLE_SOURCE,
    sample: true,
    chart: [
      { boomLength: 9.5, capacities: [[3, 25], [4, 18], [5, 14], [6, 11.5], [7, 9.5]] },
      { boomLength: 16.6, capacities: [[4, 14], [6, 10.5], [8, 7.6], [10, 5.6], [12, 4.3], [14, 3.4]] },
      { boomLength: 23.8, capacities: [[5, 9.0], [8, 6.6], [10, 5.2], [12, 4.1], [14, 3.3], [16, 2.6], [18, 2.1], [20, 1.7]] },
      { boomLength: 31, capacities: [[6, 6.0], [10, 4.4], [14, 2.9], [18, 1.9], [20, 1.6], [22, 1.3], [24, 1.1], [26, 0.9], [28, 0.7]] },
    ],
  },
  {
    id: 'sample-50',
    name: '이동식 50t (샘플)',
    classTon: 50,
    boomMin: 10.5,
    boomMax: 40,
    pivotHeight: 2.3,
    hookBlockWeight: 0.45,
    minAngle: 15,
    maxAngle: 80,
    outriggerSpan: 7.2,
    selfWeight: 36,
    source: SAMPLE_SOURCE,
    sample: true,
    chart: [
      { boomLength: 10.5, capacities: [[3, 50], [4, 38], [5, 30], [6, 25], [8, 18]] },
      { boomLength: 20.4, capacities: [[4, 28], [6, 21], [8, 16], [10, 12.5], [12, 10], [14, 8.2], [16, 6.8]] },
      { boomLength: 30.2, capacities: [[6, 15], [8, 12.5], [10, 10.4], [14, 7.2], [18, 5.1], [22, 3.7], [24, 3.2], [26, 2.8]] },
      { boomLength: 40, capacities: [[8, 9.0], [12, 6.8], [16, 5.0], [20, 3.8], [24, 2.9], [28, 2.2], [32, 1.7], [36, 1.3]] },
    ],
  },
  {
    id: 'sample-100',
    name: '이동식 100t (샘플)',
    classTon: 100,
    boomMin: 11.2,
    boomMax: 52,
    pivotHeight: 2.6,
    hookBlockWeight: 0.9,
    minAngle: 15,
    maxAngle: 82,
    outriggerSpan: 8.4,
    selfWeight: 48,
    source: SAMPLE_SOURCE,
    sample: true,
    chart: [
      { boomLength: 11.2, capacities: [[3, 100], [4, 80], [5, 66], [6, 56], [8, 42]] },
      { boomLength: 24, capacities: [[5, 52], [8, 36], [10, 29], [12, 24], [14, 20], [16, 17], [18, 14.5]] },
      { boomLength: 38, capacities: [[8, 26], [12, 19], [16, 14], [20, 10.8], [24, 8.4], [28, 6.6], [32, 5.2]] },
      { boomLength: 52, capacities: [[10, 15], [14, 12], [18, 9.4], [22, 7.6], [26, 6.1], [30, 5.0], [34, 4.1], [38, 3.4], [42, 2.8], [46, 2.3]] },
    ],
  },
];

export function findCrane(id: string): Crane | undefined {
  return CRANES.find((c) => c.id === id);
}
