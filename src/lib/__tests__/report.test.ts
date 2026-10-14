import { describe, expect, it } from '@jest/globals';
import { DEFAULT_INPUT, review } from '../calc';
import { reportHtml } from '../report';
import { SAMPLE_CRANES } from '../__fixtures__/cranes';

describe('reportHtml', () => {
  it('includes the site, chosen crane, verdict, load ratio and every candidate', () => {
    const input = { ...DEFAULT_INPUT, siteName: '테스트 <현장>', dims: { length: 4, width: 2, height: 1 } };
    const r = review(input, SAMPLE_CRANES);
    const ev = r.evals.find((e) => e.crane.id === r.recommendedId)!;
    const html = reportHtml(input, r, ev, '2026.10.14');
    expect(html).toContain('테스트 &lt;현장&gt;');
    expect(html).toContain(ev.crane.name);
    expect(html).toContain(`${Math.round(ev.ratio * 100)} %`);
    for (const e of r.evals) expect(html).toContain(e.crane.name);
    expect(html).toContain('1가닥 장력');
    expect(html).toContain('접지압');
    expect(html).toContain('<svg');
  });
});
