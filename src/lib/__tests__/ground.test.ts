import { describe, expect, it } from '@jest/globals';
import { groundCheck, REACTION_SHARE } from '../ground';
import { DEFAULT_INPUT, evaluateCrane, normalizeInput } from '../calc';
import { sample } from '../__fixtures__/cranes';

describe('groundCheck', () => {
  it('estimates the max outrigger reaction and pad pressure', () => {
    const g = groundCheck(26, 1.3, 150, 1.2)!;
    expect(g.reaction).toBeCloseTo(REACTION_SHARE * 27.3, 6);
    expect(g.pressure).toBeCloseTo((g.reaction * 9.80665) / 1.44, 6);
    expect(g.ratio).toBeCloseTo(g.pressure / 150, 6);
    // At the required pad size, ground pressure equals the allowable bearing capacity
    expect(groundCheck(26, 1.3, 150, g.requiredPad)!.ratio).toBeCloseTo(1, 6);
  });
  it('grades ok / warn / no by pressure ratio', () => {
    expect(groundCheck(20, 0, 600, 2)!.verdict).toBe('ok');
    const need = groundCheck(20, 0, 150, 1)!.requiredPad;
    expect(groundCheck(20, 0, 150, need * 1.05)!.verdict).toBe('warn');
    expect(groundCheck(20, 0, 150, need * 0.95)!.verdict).toBe('no');
  });
  it('returns null without crane weight', () => {
    expect(groundCheck(0, 1, 150, 1.2)).toBeNull();
  });
});

describe('ground in evaluateCrane', () => {
  it('uses crane weight plus hook load', () => {
    const c = sample('sample-25');
    const e = evaluateCrane(c, DEFAULT_INPUT);
    expect(e.ground!.reaction).toBeCloseTo(REACTION_SHARE * (c.selfWeight + e.totalLoad), 6);
  });
  it('fills new fields for old saved inputs', () => {
    const old = { ...DEFAULT_INPUT } as Partial<typeof DEFAULT_INPUT>;
    delete old.groundBearing;
    delete old.padSize;
    expect(normalizeInput(old).groundBearing).toBe(DEFAULT_INPUT.groundBearing);
  });
});
