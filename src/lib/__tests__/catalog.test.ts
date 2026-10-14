import { describe, expect, it } from '@jest/globals';
import { CATALOG, DEFAULT_FILTER, filterCatalog, firstNumber, MAKERS } from '../catalog';
import { chartToRows, CRANES } from '../cranes';
import { DEFAULT_INPUT, lookupCapacity, review } from '../calc';

describe('catalog data', () => {
  it('has unique ids, 5 makers, and nothing over 200t', () => {
    const ids = CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(CATALOG.map((e) => e.maker))).toEqual(new Set(MAKERS.map((m) => m.key)));
    expect(CATALOG.every((e) => e.classTon > 0 && e.classTon <= 200)).toBe(true);
  });
  it('gives every official entry a source link', () => {
    expect(CATALOG.filter((e) => e.confidence === '공식' && !e.sourceUrl)).toEqual([]);
  });
});

describe('filterCatalog', () => {
  it('filters by maker, band, discontinued and search', () => {
    const grove = filterCatalog(CATALOG, { ...DEFAULT_FILTER, maker: 'Grove' });
    expect(grove.length).toBeGreaterThan(0);
    expect(grove.every((e) => e.maker === 'Grove')).toBe(true);
    const mid = filterCatalog(CATALOG, { ...DEFAULT_FILTER, band: 'b2' });
    expect(mid.every((e) => e.classTon >= 26 && e.classTon < 51)).toBe(true);
    expect(filterCatalog(CATALOG, { ...DEFAULT_FILTER, includeDiscontinued: false }).every((e) => e.current)).toBe(true);
    // ignore spaces, dots and hyphens
    expect(filterCatalog(CATALOG, { ...DEFAULT_FILTER, query: 'ltm1050 3.1' }).map((e) => e.model)).toContain('LTM 1050-3.1');
    expect(filterCatalog(CATALOG, { ...DEFAULT_FILTER, query: 'gr700n' }).some((e) => e.model === 'GR-700N')).toBe(true);
  });
  it('chartOnly keeps the review cranes', () => {
    const l = filterCatalog(CATALOG, { ...DEFAULT_FILTER, chartOnly: true });
    expect(l.map((e) => e.id).sort()).toEqual(CRANES.map((c) => c.id).sort());
  });
});

describe('firstNumber', () => {
  it('reads the first number in a spec string', () => {
    expect(firstNumber('최대 6.6 m')).toBe(6.6);
    expect(firstNumber('19.795 t')).toBe(19.795);
    expect(firstNumber(undefined)).toBeNull();
  });
});

describe('review cranes from real load charts', () => {
  it('builds Tadano GR-N cranes with sorted, well-formed charts', () => {
    expect(CRANES.length).toBeGreaterThanOrEqual(5);
    for (const c of CRANES) {
      expect(c.sample).toBe(false);
      expect(c.chart.length).toBeGreaterThan(1);
      const booms = c.chart.map((r) => r.boomLength);
      expect([...booms].sort((a, b) => a - b)).toEqual(booms);
      for (const row of c.chart) {
        const radii = row.capacities.map(([r]) => r);
        expect([...radii].sort((a, b) => a - b)).toEqual(radii);
        expect(row.capacities.every(([, t]) => t > 0 && t <= c.classTon + 1e-9)).toBe(true);
      }
      expect(c.assumed.length).toBeGreaterThan(0);
    }
  });
  it('transposes radius rows into boom rows and keeps verify flags', () => {
    const rows = chartToRows({
      boomLengths: [10, 20],
      rows: [
        { radius: 3, t: [20, null], verify: false },
        { radius: 8, t: [8, 6], verify: true },
      ],
    });
    expect(rows).toEqual([
      { boomLength: 10, capacities: [[3, 20], [8, 8]], unverified: [8] },
      { boomLength: 20, capacities: [[8, 6]], unverified: [8] },
    ]);
    expect(lookupCapacity(rows, 10, 2.5)?.chartVerified).toBe(true);
    expect(lookupCapacity(rows, 10, 5)?.chartVerified).toBe(false);
  });
  it('reviews the default job with the real cranes', () => {
    const r = review(DEFAULT_INPUT);
    expect(r.evals.length).toBe(CRANES.length);
    expect(r.recommendedId).not.toBeNull();
  });
});
