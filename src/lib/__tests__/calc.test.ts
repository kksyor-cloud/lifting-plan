import { describe, expect, it } from '@jest/globals';
import { autoDistance, DEFAULT_INPUT, evaluateCrane, lookupCapacity, minSetback, normalizeInput, requiredTipHeight, review, slingFor, stepCrane, ReviewInput } from '../calc';
import { SAMPLE_CRANES as CRANES, sample } from '../__fixtures__/cranes';

const c25 = sample('sample-25');
const input = (over: Partial<ReviewInput> = {}): ReviewInput => ({ ...DEFAULT_INPUT, ...over });

describe('lookupCapacity', () => {
  const chart = c25.chart;
  it('uses the next longer boom row and the next farther radius', () => {
    expect(lookupCapacity(chart, 17, 9)).toEqual({ capacity: 5.2, chartBoomLength: 23.8, chartRadius: 10, chartVerified: true });
  });
  it('matches exact table points', () => {
    expect(lookupCapacity(chart, 16.6, 8)).toEqual({ capacity: 7.6, chartBoomLength: 16.6, chartRadius: 8, chartVerified: true });
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
    const R = i.radius;
    // tip = pivot + sqrt(L² - R²)
    expect(e.tipHeight).toBeCloseTo(c25.pivotHeight + Math.sqrt(e.boomLength ** 2 - R ** 2), 6);
    expect(e.tipHeight).toBeGreaterThanOrEqual(requiredTipHeight(i));
    expect(e.wallClearance).toBeGreaterThanOrEqual(1);
    expect(e.topClearance).toBeCloseTo(e.tipHeight - i.buildingHeight, 6);
    // 0.1 m shorter must fail the conditions
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
    const e = evaluateCrane(c25, input({ setback: 20, radius: 35 }));
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
    const r = review(input(), CRANES);
    expect(r.evals.map((e) => e.crane.classTon)).toEqual([...CRANES].map((c) => c.classTon).sort((a, b) => a - b));
    const firstOk = r.evals.find((e) => e.verdict === 'ok');
    expect(r.recommendedId).toBe(firstOk?.crane.id ?? null);
  });
  it('moves the recommendation up when the small crane is overloaded', () => {
    const r = review(input({ loadWeight: 8 }), CRANES);
    expect(r.recommendedId).not.toBe('sample-25');
  });
  it('recommends nothing when no crane can do it', () => {
    expect(review(input({ buildingHeight: 90, loadWeight: 60 }), CRANES).recommendedId).toBeNull();
  });
});

describe('evaluateCrane with gaps in the chart', () => {
  it('uses a longer boom when the shortest boom has no chart cell', () => {
    const gappy = { ...c25, chart: c25.chart.map((r) => (r.boomLength === 23.8 ? { ...r, capacities: [] as [number, number][] } : r)) };
    const full = evaluateCrane(c25, input());
    const e = evaluateCrane(gappy, input());
    if (full.chartBoomLength === 23.8) {
      expect(e.feasible).toBe(true);
      expect(e.chartBoomLength).toBe(31);
      expect(e.boomLength).toBeGreaterThan(23.8);
    }
    expect(e.capacity).toBeLessThanOrEqual(full.capacity);
  });
});

describe('autoDistance (max-distance auto-calc)', () => {
  it('finds the farthest reach that is still ok, and nothing farther is ok', () => {
    const i = input();
    const plan = autoDistance(c25, i, { setback: false, radius: false })!;
    expect(plan).not.toBeNull();
    expect(plan.verdict).toBe('ok');
    expect(plan.setback).toBeGreaterThanOrEqual(minSetback(c25));
    expect(evaluateCrane(c25, { ...i, ...plan }).verdict).toBe('ok');
    const reach = plan.radius - plan.setback;
    // At the same setback, adding 0.5 m of radius must no longer be '가능' (feasible)
    expect(evaluateCrane(c25, { ...i, setback: plan.setback, radius: plan.radius + 0.5 }).verdict).not.toBe('ok');
    expect(reach).toBeGreaterThan(0);
  });

  it('keeps locked values', () => {
    const i = input({ setback: 9, radius: 12 });
    const s = autoDistance(c25, i, { setback: true, radius: false })!;
    expect(s.setback).toBe(9);
    const r = autoDistance(c25, i, { setback: false, radius: true })!;
    expect(r.radius).toBe(12);
  });

  it('returns null when nothing works', () => {
    expect(autoDistance(c25, input({ loadWeight: 50 }), { setback: false, radius: false })).toBeNull();
  });
});

describe('stepCrane (UP/DN)', () => {
  it('moves one class up or down and stops at the ends', () => {
    const sorted = [...CRANES].sort((a, b) => a.classTon - b.classTon);
    expect(stepCrane(sorted[0].id, 1, CRANES)!.id).toBe(sorted[1].id);
    expect(stepCrane(sorted[1].id, -1, CRANES)!.id).toBe(sorted[0].id);
    expect(stepCrane(sorted[0].id, -1, CRANES)).toBeNull();
    expect(stepCrane(sorted[sorted.length - 1].id, 1, CRANES)).toBeNull();
  });
});

describe('normalizeInput', () => {
  it('converts old saved reach into radius', () => {
    const old = { ...DEFAULT_INPUT, setback: 10, reach: 5 } as Partial<ReviewInput> & { reach: number };
    delete (old as Partial<ReviewInput>).radius;
    const n = normalizeInput(old);
    expect(n.radius).toBe(15);
    expect('reach' in n).toBe(false);
  });
});
