// 검토서 HTML. 인쇄(PDF)용이라 화면 컴포넌트와 별도로 같은 계산 결과에서 만든다.
import { CraneEval, DEFAULT_LOAD_STACK, FAIL_LABEL, HOOK_ALLOWANCE, MIN_WALL_CLEARANCE, ReviewInput, ReviewResult, ROOF_MARGIN, VERDICT_LABEL, WARN_RATIO } from './calc';
import { GROUND_WARN_RATIO, REACTION_SHARE } from './ground';

const VC = { ok: '#2F7D4F', warn: '#E06A10', no: '#C62828' } as const;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const m = (v: number) => `${v.toFixed(1)} m`;
const t = (v: number) => `${v.toFixed(2)} t`;
const pct = (v: number) => (Number.isFinite(v) ? `${Math.round(v * 100)} %` : '—');

function row(k: string, v: string, strong = false) {
  return `<tr><th>${esc(k)}</th><td${strong ? ' class="b"' : ''}>${esc(v)}</td></tr>`;
}

/** 측면도 SVG (화면 Diagram 과 같은 좌표 계산) */
export function diagramSvg(input: ReviewInput, ev: CraneEval, w = 640, h = 300): string {
  const R = input.setback + input.reach;
  const H = input.buildingHeight;
  const hp = ev.crane.pivotHeight;
  const tip = Math.max(ev.tipHeight, hp);
  const bldgW = Math.max(input.reach + 4, 8);
  const minX = -ev.crane.outriggerSpan / 2 - 1.5;
  const maxX = input.setback + bldgW + 1;
  const maxY = Math.max(tip, H) * 1.12 + 2;
  const pad = { l: 10, r: 10, t: 12, b: 30 };
  const s = Math.min((w - pad.l - pad.r) / (maxX - minX), (h - pad.t - pad.b) / maxY);
  const X = (x: number) => (pad.l + (x - minX) * s).toFixed(1);
  const Y = (y: number) => (h - pad.b - y * s).toFixed(1);
  const loadH = input.dims?.height ?? 1.0;
  const loadW = input.dims ? Math.max(input.dims.length, input.dims.width) : 2.0;
  const hookY = H + ROOF_MARGIN + (input.dims ? loadH : DEFAULT_LOAD_STACK);
  const loadTop = hookY - (input.dims ? 0 : DEFAULT_LOAD_STACK - loadH);
  const o = ev.crane.outriggerSpan;
  const boom =
    ev.boomAngle > 0
      ? `<line x1="${X(0)}" y1="${Y(hp)}" x2="${X(R)}" y2="${Y(tip)}" stroke="#FFC21A" stroke-width="7" stroke-linecap="round"/>
<line x1="${X(0)}" y1="${Y(hp)}" x2="${X(R)}" y2="${Y(tip)}" stroke="#2B2B2E" stroke-width="1.5"/>
<line x1="${X(R)}" y1="${Y(tip)}" x2="${X(R)}" y2="${Y(hookY)}" stroke="#2B2B2E" stroke-width="1.2"/>
<rect x="${(Number(X(R)) - (loadW / 2) * s).toFixed(1)}" y="${Y(loadTop)}" width="${(loadW * s).toFixed(1)}" height="${(loadH * s).toFixed(1)}" fill="${VC[ev.verdict]}" rx="2"/>
<line x1="${X(R)}" y1="${Y(tip)}" x2="${w - 4}" y2="${Y(tip)}" stroke="#8C857C" stroke-dasharray="3 3"/>
<text x="${w - 6}" y="${Number(Y(tip)) - 5}" text-anchor="end" class="mono">Tip ${tip.toFixed(1)}m · 붐 ${ev.boomLength.toFixed(1)}m · ${ev.boomAngle.toFixed(1)}°</text>`
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%">
<style>text{font-size:11px;fill:#2B2B2E}.mono{font-family:monospace}</style>
<line x1="0" y1="${Y(0)}" x2="${w}" y2="${Y(0)}" stroke="#8C857C" stroke-width="1.5"/>
<rect x="${X(input.setback)}" y="${Y(H)}" width="${(bldgW * s).toFixed(1)}" height="${(H * s).toFixed(1)}" fill="#EDE7DA" stroke="#8C857C"/>
<text x="${Number(X(input.setback)) + 6}" y="${Number(Y(H)) + 16}">건물 ${H.toFixed(1)}m</text>
<rect x="${X(-o / 2)}" y="${Y(hp * 0.75)}" width="${(o * s).toFixed(1)}" height="${(hp * 0.55 * s).toFixed(1)}" rx="3" fill="#2B2B2E"/>
${boom}
<line x1="${X(0)}" y1="${h - 10}" x2="${X(R)}" y2="${h - 10}" stroke="#2B2B2E"/>
<line x1="${X(0)}" y1="${h - 15}" x2="${X(0)}" y2="${h - 5}" stroke="#2B2B2E"/><line x1="${X(R)}" y1="${h - 15}" x2="${X(R)}" y2="${h - 5}" stroke="#2B2B2E"/>
<text x="${((Number(X(0)) + Number(X(R))) / 2).toFixed(1)}" y="${h - 14}" text-anchor="middle" class="mono">R ${R.toFixed(1)}m</text>
</svg>`;
}

export function reportHtml(input: ReviewInput, result: ReviewResult, ev: CraneEval, date: string): string {
  const c = ev.crane;
  const g = ev.ground;
  const badge = (label: string, v: keyof typeof VC) => `<span class="badge" style="background:${VC[v]}">${label}</span>`;
  const candidates = result.evals
    .map(
      (e) =>
        `<tr${e.crane.id === c.id ? ' class="sel"' : ''}><td>${esc(e.crane.name)}${e.crane.id === result.recommendedId ? ' <b>(추천)</b>' : ''}</td><td>${
          e.feasible ? `${m(e.boomLength)} / ${e.boomAngle.toFixed(1)}°` : esc(e.reason ? FAIL_LABEL[e.reason] : '')
        }</td><td class="n">${e.feasible ? t(e.capacity) : '—'}</td><td class="n">${e.feasible ? pct(e.ratio) : '—'}</td><td style="color:${VC[e.verdict]};font-weight:700">${VERDICT_LABEL[e.verdict]}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>양중 검토서 ${esc(input.siteName)}</title>
<style>
@page{size:A4;margin:14mm}
body{font-family:"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;color:#2B2B2E;font-size:11.5px;line-height:1.5;margin:0}
.head{background:#FFC21A;padding:14px 16px;border-radius:6px;display:flex;justify-content:space-between;align-items:flex-end}
.head h1{margin:0;font-size:20px}.head .sub{font-size:11px;color:#4A3A10;letter-spacing:.1em}
.verdict{display:flex;justify-content:space-between;align-items:center;margin:14px 0 6px}
.verdict .name{font-size:16px;font-weight:700}
.badge{color:#fff;font-weight:700;padding:3px 10px;border-radius:4px;font-size:13px}
h2{font-size:11px;letter-spacing:.12em;color:#6E6860;margin:16px 0 6px;border-bottom:1px solid #E8E1D2;padding-bottom:3px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
table{border-collapse:collapse;width:100%}
th,td{padding:3px 6px;border-bottom:1px solid #EFEAE0;text-align:left;vertical-align:top}
th{font-weight:400;color:#6E6860;width:48%}
td{font-family:monospace}td.b{font-weight:700}
.cand th{color:#6E6860;font-size:10.5px;width:auto;white-space:nowrap}.cand td{white-space:nowrap}.cand td{font-family:inherit}.cand td.n{font-family:monospace;text-align:right}
.cand tr.sel td{background:#FFF4CF}
.warn{color:#E06A10}.note{font-size:10px;color:#6E6860}
.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
.sign div{border:1px solid #CFC7B6;height:56px;border-radius:4px;padding:4px 8px;font-size:10px;color:#6E6860}
.box{border:1px solid #E8E1D2;border-radius:6px;padding:6px}
</style></head><body>
<div class="head"><div><div class="sub">리프팅 플랜 · 양중 사전 검토서</div><h1>${esc(input.siteName || '이름 없는 현장')}</h1></div><div class="sub">${esc(date)}</div></div>
<div class="verdict"><span class="name">${esc(c.name)}</span>${badge(`양중 ${VERDICT_LABEL[ev.verdict]}`, ev.verdict)}</div>
${ev.reason ? `<p class="warn">${esc(FAIL_LABEL[ev.reason])}</p>` : ''}
${ev.feasible && !ev.chartVerified ? '<p class="warn">적용한 하중표 칸은 원본 대조가 필요한 값입니다.</p>' : ''}
<div class="box">${diagramSvg(input, ev)}</div>
<div class="grid">
<div><h2>검토 값</h2><table>
${row('건물 높이', m(input.buildingHeight))}
${row('작업반경 (이격 + 도달)', `${m(result.radius)} (${input.setback} + ${input.reach})`)}
${row('붐 길이 / 각도', ev.boomAngle > 0 ? `${m(ev.boomLength)} / ${ev.boomAngle.toFixed(1)}°` : '—')}
${row('붐 끝(Tip) 높이', ev.boomAngle > 0 ? m(ev.tipHeight) : '—')}
${row('필요 Tip 높이', m(result.requiredTipHeight))}
${row('외벽 여유 (모서리 ~ 붐)', ev.boomAngle > 0 ? m(ev.wallClearance) : '—')}
</table></div>
<div><h2>하중</h2><table>
${row('자재 중량', t(input.loadWeight))}
${row('줄걸이 용구', t(input.riggingWeight))}
${row('훅 블록', t(c.hookBlockWeight))}
${row('합계', t(ev.totalLoad), true)}
${row(`정격하중 (붐 ${ev.chartBoomLength || '—'}m · 반경 ${ev.chartRadius || '—'}m)`, ev.feasible ? t(ev.capacity) : '—')}
${row('하중률', ev.feasible ? pct(ev.ratio) : '—', true)}
</table></div>
${
  result.sling
    ? `<div><h2>줄걸이 (2가닥 기준)</h2><table>
${row('각도 (수평 기준)', `${input.slingAngle}°`)}
${row('1가닥 길이', m(result.sling.legLength))}
${row('줄걸이 높이', m(result.sling.height))}
${row('1가닥 장력', t(result.sling.tension), true)}
</table></div>`
    : ''
}
${
  g
    ? `<div><h2>아웃리거 반력·지반 (간이) ${badge(VERDICT_LABEL[g.verdict], g.verdict)}</h2><table>
${row('추정 최대 반력', `${t(g.reaction)} (${g.reactionKN.toFixed(0)} kN)`)}
${row('받침판', `${input.padSize} × ${input.padSize} m`)}
${row('접지압', `${g.pressure.toFixed(0)} kN/m²`, true)}
${row('허용 지지력', `${g.bearing} kN/m²`)}
${row('지지력 대비', pct(g.ratio), true)}
${row('필요 받침판 (최소)', `${g.requiredPad.toFixed(2)} m 각`)}
</table></div>`
    : ''
}
<div><h2>장비</h2><table>
${row('장비', c.name)}
${row('등급 / 붐', `${c.classTon} t / ${c.boomMin} ~ ${c.boomMax} m`)}
${row('아웃리거 폭 / 중량', `${c.outriggerSpan} m / ${c.selfWeight} t`)}
${c.assumed.length ? row('가정값', c.assumed.join(', ')) : ''}
</table></div>
</div>
<h2>후보 장비 비교</h2>
<table class="cand"><tr><th>장비</th><th>붐 / 각도</th><th style="text-align:right">정격</th><th style="text-align:right">하중률</th><th>판정</th></tr>${candidates}</table>
<h2>근거·기준</h2>
<p class="note">하중표: ${esc(c.source)}${c.chartDoc ? ` · ${esc(c.chartDoc)}` : ''}<br>
판정: 하중률 ${Math.round(WARN_RATIO * 100)}% 이하 가능, 100% 이하 주의, 초과 불가. 하중표는 같거나 긴 붐, 같거나 먼 반경 칸을 적용(보수적).<br>
높이 가정: 건물 위 여유 ${ROOF_MARGIN}m + 자재·줄걸이 높이 + 훅 블록·권상 여유 ${HOOK_ALLOWANCE}m. 외벽 최소 여유 ${MIN_WALL_CLEARANCE}m.<br>
지반: 최대 반력 = ${REACTION_SHARE * 100}% × (장비 중량 + 인양 하중) 간이 추정, 지지력 대비 ${Math.round(GROUND_WARN_RATIO * 100)}% 초과 주의. 제조사 반력표로 확인 필요.<br>
<b>이 검토서는 사전 검토용입니다. 작업 전에 제조사 공인 하중표, 지반 지지력, 풍속, 신호수 배치를 반드시 확인하세요.</b></p>
<div class="sign"><div>작성</div><div>검토</div><div>확인</div></div>
</body></html>`;
}
