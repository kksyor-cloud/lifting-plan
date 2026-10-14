import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CraneEval, DEFAULT_LOAD_STACK, ReviewInput, ROOF_MARGIN } from '@/lib/calc';
import { color, font, verdictColor } from '@/theme';

// 측면도: 크레인, 붐, 건물, 훅과 자재. 모든 값은 같은 계산 결과(ev)에서 가져온다.
export function Diagram({ input, ev, height = 260 }: { input: ReviewInput; ev: CraneEval; height?: number }) {
  const [w, setW] = useState(320);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const R = input.setback + input.reach;
  const H = input.buildingHeight;
  const hp = ev.crane.pivotHeight;
  const tip = Math.max(ev.tipHeight, hp);
  const bldgW = Math.max(input.reach + 4, 8);
  const minX = -ev.crane.outriggerSpan / 2 - 1.5;
  const maxX = input.setback + bldgW + 1;
  const maxY = Math.max(tip, H) * 1.12 + 2;

  const pad = { l: 8, r: 8, t: 10, b: 26 };
  const s = Math.min((w - pad.l - pad.r) / (maxX - minX), (height - pad.t - pad.b) / maxY);
  const X = (x: number) => pad.l + (x - minX) * s;
  const Y = (y: number) => height - pad.b - y * s;

  const loadH = input.dims?.height ?? 1.0;
  const loadW = input.dims ? Math.max(input.dims.length, input.dims.width) : 2.0;
  const hookY = H + ROOF_MARGIN + (input.dims ? loadH : DEFAULT_LOAD_STACK);
  const loadTop = hookY - (input.dims ? 0 : DEFAULT_LOAD_STACK - loadH);
  const vc = verdictColor[ev.verdict];

  return (
    <View onLayout={onLayout} style={{ width: '100%', height }}>
      <Svg width={w} height={height}>
        {/* 지면 */}
        <Line x1={0} y1={Y(0)} x2={w} y2={Y(0)} stroke={color.warm} strokeWidth={1.5} />
        {/* 건물 */}
        <Rect x={X(input.setback)} y={Y(H)} width={bldgW * s} height={H * s} fill="#EDE7DA" stroke={color.warm} strokeWidth={1} />
        <SvgText x={X(input.setback) + 6} y={Y(H) + 16} fontSize={11} fontFamily={font.body} fill={color.muted}>
          {`건물 ${H.toFixed(1)}m`}
        </SvgText>
        {/* 크레인 차체 */}
        <Rect x={X(-ev.crane.outriggerSpan / 2)} y={Y(hp * 0.75)} width={ev.crane.outriggerSpan * s} height={hp * 0.55 * s} rx={3} fill={color.charcoal} />
        <Rect x={X(-0.9)} y={Y(hp + 0.2)} width={1.8 * s} height={0.6 * s} rx={2} fill={color.charcoal} />
        {[-1, 1].map((k) => (
          <Circle key={k} cx={X((k * ev.crane.outriggerSpan) / 3)} cy={Y(0.25)} r={Math.max(3, 0.45 * s)} fill={color.charcoal} />
        ))}
        {ev.boomAngle > 0 ? (
          <G>
            {/* 붐 */}
            <Line x1={X(0)} y1={Y(hp)} x2={X(R)} y2={Y(tip)} stroke={color.yellow} strokeWidth={7} strokeLinecap="round" />
            <Line x1={X(0)} y1={Y(hp)} x2={X(R)} y2={Y(tip)} stroke={color.charcoal} strokeWidth={1.5} />
            <Circle cx={X(0)} cy={Y(hp)} r={4} fill={color.charcoal} />
            {/* 와이어, 훅, 자재 */}
            <Line x1={X(R)} y1={Y(tip)} x2={X(R)} y2={Y(hookY)} stroke={color.charcoal} strokeWidth={1.2} />
            <Path d={`M${X(R) - (loadW / 2) * s} ${Y(loadTop)} L${X(R)} ${Y(hookY)} L${X(R) + (loadW / 2) * s} ${Y(loadTop)}`} stroke={color.warm} strokeWidth={1} fill="none" />
            <Rect x={X(R) - (loadW / 2) * s} y={Y(loadTop)} width={loadW * s} height={loadH * s} fill={vc} opacity={0.85} rx={2} />
            {/* 붐 끝 높이 */}
            <Line x1={X(R) + 6} y1={Y(tip)} x2={w - 4} y2={Y(tip)} stroke={color.warm} strokeDasharray="3 3" />
            <SvgText x={w - 6} y={Y(tip) - 4} fontSize={11} textAnchor="end" fontFamily={font.mono} fill={color.charcoal}>
              {`Tip ${tip.toFixed(1)}m`}
            </SvgText>
            <SvgText x={w - 6} y={Y(tip) + 13} fontSize={11} textAnchor="end" fontFamily={font.mono} fill={color.muted}>
              {`붐 ${ev.boomLength.toFixed(1)}m · ${ev.boomAngle.toFixed(1)}°`}
            </SvgText>
          </G>
        ) : null}
        {/* 작업반경 치수선 */}
        <Line x1={X(0)} y1={height - 10} x2={X(R)} y2={height - 10} stroke={color.charcoal} strokeWidth={1} />
        <Line x1={X(0)} y1={height - 15} x2={X(0)} y2={height - 5} stroke={color.charcoal} />
        <Line x1={X(R)} y1={height - 15} x2={X(R)} y2={height - 5} stroke={color.charcoal} />
        <SvgText x={(X(0) + X(R)) / 2} y={height - 14} fontSize={11} textAnchor="middle" fontFamily={font.mono} fill={color.charcoal}>
          {`R ${R.toFixed(1)}m`}
        </SvgText>
      </Svg>
    </View>
  );
}
