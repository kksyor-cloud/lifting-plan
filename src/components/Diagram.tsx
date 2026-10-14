import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CraneEval, DEFAULT_LOAD_STACK, ReviewInput, ROOF_MARGIN } from '@/lib/calc';
import { color, font, verdictColor } from '@/theme';

// Side view: crane, boom, building, hook and load. Every value comes from the same evaluation result (ev).
export function Diagram({ input, ev, height = 260, topPad = 10 }: { input: ReviewInput; ev: CraneEval; height?: number; topPad?: number }) {
  const [w, setW] = useState(320);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const R = input.radius;
  const reach = R - input.setback;
  const H = input.buildingHeight;
  const hp = ev.crane.pivotHeight;
  const tip = Math.max(ev.tipHeight, hp);
  const bldgW = Math.max(reach + 4, 8);
  const minX = -ev.crane.outriggerSpan / 2 - 1.5;
  const maxX = input.setback + bldgW + 1;
  const maxY = Math.max(tip, H) * 1.12 + 2;

  const pad = { l: 8, r: 8, t: topPad, b: 44 };
  // Width can be 0 before the first layout, so keep the scale from going negative.
  const s = Math.max(0.01, Math.min((w - pad.l - pad.r) / (maxX - minX), (height - pad.t - pad.b) / maxY));
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
        {/* 5 m grid */}
        <G opacity={0.5}>
          {Array.from({ length: Math.ceil((maxX - minX) / 5) + 1 }, (_, i) => Math.ceil(minX / 5) * 5 + i * 5).map((x) => (
            <Line key={`x${x}`} x1={X(x)} y1={0} x2={X(x)} y2={Y(0)} stroke={color.line} strokeWidth={1} />
          ))}
          {Array.from({ length: Math.ceil(height / (5 * s)) + 1 }, (_, i) => i * 5).map((y) => (
            <Line key={`y${y}`} x1={0} y1={Y(y)} x2={w} y2={Y(y)} stroke={color.line} strokeWidth={1} />
          ))}
        </G>
        {/* Ground */}
        <Line x1={0} y1={Y(0)} x2={w} y2={Y(0)} stroke={color.warm} strokeWidth={1.5} />
        {/* Building */}
        <Rect x={X(input.setback)} y={Y(H)} width={bldgW * s} height={H * s} fill="#EDE7DA" stroke={color.warm} strokeWidth={1} />
        <SvgText x={X(input.setback) + 6} y={(Y(H) + Y(0)) / 2 + 4} fontSize={11} fontFamily={font.body} fill={color.muted}>
          {`건물 ${H.toFixed(1)}m`}
        </SvgText>
        {/* Crane carrier */}
        <Rect x={X(-ev.crane.outriggerSpan / 2)} y={Y(hp * 0.75)} width={ev.crane.outriggerSpan * s} height={hp * 0.55 * s} rx={3} fill={color.charcoal} />
        <Rect x={X(-0.9)} y={Y(hp + 0.2)} width={1.8 * s} height={0.6 * s} rx={2} fill={color.charcoal} />
        {[-1, 1].map((k) => (
          <Circle key={k} cx={X((k * ev.crane.outriggerSpan) / 3)} cy={Y(0.25)} r={Math.max(3, 0.45 * s)} fill={color.charcoal} />
        ))}
        {ev.boomAngle > 0 ? (
          <G>
            {/* Boom */}
            <Line x1={X(0)} y1={Y(hp)} x2={X(R)} y2={Y(tip)} stroke={color.yellow} strokeWidth={7} strokeLinecap="round" />
            <Line x1={X(0)} y1={Y(hp)} x2={X(R)} y2={Y(tip)} stroke={color.charcoal} strokeWidth={1.5} />
            <Circle cx={X(0)} cy={Y(hp)} r={4} fill={color.charcoal} />
            {/* Wire rope, hook, load */}
            <Line x1={X(R)} y1={Y(tip)} x2={X(R)} y2={Y(hookY)} stroke={color.charcoal} strokeWidth={1.2} />
            <Path d={`M${X(R) - (loadW / 2) * s} ${Y(loadTop)} L${X(R)} ${Y(hookY)} L${X(R) + (loadW / 2) * s} ${Y(loadTop)}`} stroke={color.warm} strokeWidth={1} fill="none" />
            <Rect x={X(R) - (loadW / 2) * s} y={Y(loadTop)} width={loadW * s} height={loadH * s} fill={vc} opacity={0.85} rx={2} />
            {/* Boom tip height */}
            <Line x1={X(R) + 6} y1={Y(tip)} x2={w - 4} y2={Y(tip)} stroke={color.warm} strokeDasharray="3 3" />
            <SvgText x={w - 6} y={Y(tip) - 4} fontSize={11} textAnchor="end" fontFamily={font.mono} fill={color.charcoal}>
              {`Tip ${tip.toFixed(1)}m`}
            </SvgText>
            <SvgText x={w - 6} y={Y(tip) + 13} fontSize={11} textAnchor="end" fontFamily={font.mono} fill={color.muted}>
              {`붐 ${ev.boomLength.toFixed(1)}m · ${ev.boomAngle.toFixed(1)}°`}
            </SvgText>
          </G>
        ) : null}
        {/* Reach: outer wall to lift point, above the building */}
        {reach > 0 ? (
          <G>
            <Line x1={X(input.setback)} y1={Y(H) + 10} x2={X(R)} y2={Y(H) + 10} stroke={color.charcoal} strokeWidth={1} />
            <Line x1={X(input.setback)} y1={Y(H) + 6} x2={X(input.setback)} y2={Y(H) + 14} stroke={color.charcoal} />
            <Line x1={X(R)} y1={Y(H) + 6} x2={X(R)} y2={Y(H) + 14} stroke={color.charcoal} />
            <SvgText x={(X(input.setback) + X(R)) / 2} y={Y(H) + 26} fontSize={11} textAnchor="middle" fontFamily={font.mono} fill={color.charcoal}>
              {`도달 ${reach.toFixed(1)}m`}
            </SvgText>
          </G>
        ) : null}
        {/* Setback */}
        <Dim x1={X(0)} x2={X(input.setback)} y={height - 28} label={`이격 ${input.setback.toFixed(1)}m`} />
        {/* Working radius */}
        <Dim x1={X(0)} x2={X(R)} y={height - 8} label={`작업반경 R ${R.toFixed(1)}m`} tone={color.yellowDeep} />
      </Svg>
    </View>
  );
}

function Dim({ x1, x2, y, label, tone = color.charcoal }: { x1: number; x2: number; y: number; label: string; tone?: string }) {
  return (
    <G>
      <Line x1={x1} y1={y} x2={x2} y2={y} stroke={tone} strokeWidth={1} />
      <Line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={tone} />
      <Line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={tone} />
      <SvgText x={(x1 + x2) / 2} y={y - 4} fontSize={11} textAnchor="middle" fontFamily={font.mono} fill={tone}>
        {label}
      </SvgText>
    </G>
  );
}
