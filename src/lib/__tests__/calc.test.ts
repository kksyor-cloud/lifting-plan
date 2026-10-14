import { describe, expect, it } from '@jest/globals';
import { DEFAULT_INPUT, evaluateCrane, lookupCapacity, requiredTipHeight, review, slingFor, ReviewInput } from '../calc';
import { CRANES, findCrane } from '../cranes';

const c25 = findCrane('sample-25')!;
const input = (over: Partial<ReviewInput> = {}): ReviewInput => ({ ...DEFAULT_INPUT, ...over });

describe('lookupCapacity', () => {
  const chart = c25.chart;
  it('uses the next longer boom row and the next farther radius', () => {
    expect(lookupCapacity(chart, 17, 9)).toEqual({ capacity: 5.2, chartBoomLength: 23.8, chartRadius: 10 });
  });
  it('matches exact table points', () => {
    expect(lookupCapacity(chart, 16.6, 8)).toEqual({ capacity: 7.6, chartBoomLength: 16.6, chartRadius: 8 });
  });
  it('returns null outside the chart', () => {
    expect(lookupCapacity(chart, 40, 5)).toBeNull();
    expect(lookupCapacity(chart, 31, 30)).toBeNull();
  });
});

describe('slingFor', () => {
  it('computes 2-leg sling geometry and tension', () => {
    const s = slingFor({ length: 4, width: 2, height: 1 }, 60, 1)!;
    expect(s.legLength).toBeCloseTo(4, 6); // 2 / cos60
    expect(s.height).toBeCloseTo(2 * Math.sqrt(3), 6);
    expect(s.tension).toBeCloseTo(1 / Math.sqrt(3), 6); // 1 / (2 sin60)
  });
  it('is null without dimensions', () => {
    expect(slingFor(null, 60, 1)).toBeNull();
  });
});

describe('evaluateCrane', () => {
  it('finds the shortest boom that clears height and wall, with consistent geometry', () => {
    const i = input();
    const e = evaluateCrane(c25, i);
    expect(e.feasible).toBe(true);
    const R = i.setback + i.reach;
    // tip = pivot + sqrt(L² - R²)
    expect(e.tipHeight).toBeCloseTo(c25.pivotHeight + Math.sqrt(e.boomLength ** 2 - R ** 2), 6);
    expect(e.tipHeight).toBeGreaterThanOrEqual(requiredTipHeight(i));
    expect(e.wallClearance).toBeGreaterThanOrEqual(1);
    expect(e.topClearance).toBeCloseTo(e.tipHeight - i.buildingHeight, 6);
    // 0.1m 짧으면 조건을 만족하지 못해야 한다
    const shorter = Math.round((e.boomLength - 0.1) * 10) / 10;
    const tipShorter = c25.pivotHeight + Math.sqrt(shorter ** 2 - R ** 2);
    const angleShorter = (Math.acos(R / shorter) * 180) / Math.PI;
    const wallShorter = (c25.pivotHeight + i.setback * Math.tan((angleShorter * Math.PI) / 180) - i.buildingHeight) * Math.cos((angleShorter * Math.PI) / 180);
    expect(shorter < c25.boomMin || tipShorter < requiredTipHeight(i) || wallShorter < 1 || angleShorter < c25.minAngle).toBe(true);
  });

  it('adds rigging and hook block weight to the load ratio', () => {
    const e = evaluateCrane(c25, input());
    expect(e.totalLoad).toBeCloseTo(1.0 + 0.05 + c25.hookBlockWeight, 6);
    expect(e.ratio).toBeCloseTo(e.totalLoad / e.capacity, 6);
  });

  it('flags radius beyond the longest boom', () => {
    const e = evaluateCrane(c25, input({ setback: 20, reach: 15 }));
    expect(e.feasible).toBe(false);
    expect(e.reason).toBe('radius');
    expect(e.verdict).toBe('no');
  });

  it('flags a building too tall for the boom', () => {
    const e = evaluateCrane(c25, input({ buildingHeight: 40 }));
    expect(e.feasible).toBe(false);
    expect(e.reason).toBe('height');
  });

  it('gives warn between 80% and 100% and no above 100%', () => {
    const base = evaluateCrane(c25, input({ loadWeight: 0.1 }));
    const cap = base.capacity;
    const extra = 0.05 + c25.hookBlockWeight;
    expect(evaluateCrane(c25, input({ loadWeight: cap * 0.9 - extra })).verdict).toBe('warn');
    expect(evaluateCrane(c25, input({ loadWeight: cap * 1.1 - extra })).verdict).toBe('no');
  });
});

describe('review', () => {
  it('evaluates every crane, smallest first, and recommends the smallest ok one', () => {
    const r = review(input());
    expect(r.evals.map((e) => e.crane.classTon)).toEqual([...CRANES].map((c) => c.classTon).sort((a, b) => a - b));
    const firstOk = r.evals.find((e) => e.verdict === 'ok');
    expect(r.recommendedId).toBe(firstOk?.crane.id ?? null);
  });
  it('moves the recommendation up when the small crane is overloaded', () => {
    const r = review(input({ loadWeight: 8 }));
    expect(r.recommendedId).not.toBe('sample-25');
  });
  it('recommends nothing when no crane can do it', () => {
    expect(review(input({ buildingHeight: 90, loadWeight: 60 })).recommendedId).toBeNull();
  });
});
