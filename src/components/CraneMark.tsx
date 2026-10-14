import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// 앱 아이콘(이동식 크레인)과 같은 그림. 원본: branding/icons/liftnote-icon.svg
export function CraneMark({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="cmBg" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#FFD84D" />
          <Stop offset="1" stopColor="#F2A900" />
        </LinearGradient>
        <LinearGradient id="cmSd" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A4A52" />
          <Stop offset="1" stopColor="#1F1F23" />
        </LinearGradient>
        <RadialGradient id="cmGl" cx="0.3" cy="0.15" r="0.9">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.16} />
          <Stop offset="0.6" stopColor="#ffffff" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="1024" height="1024" rx="228" fill="url(#cmBg)" />
      <Rect width="1024" height="1024" rx="228" fill="url(#cmGl)" />
      <G transform="translate(0,10)">
        <Rect x="150" y="650" width="560" height="110" rx="26" fill="url(#cmSd)" />
        <Path d="M690 760 V610 Q690 578 722 578 H790 Q822 578 832 610 L858 690 V760 Z" fill="url(#cmSd)" />
        <Path d="M716 606 H782 Q796 606 800 620 L818 680 H716 Z" fill="#F2A900" />
        <Path d="M170 660 V610 Q170 586 194 586 H392 Q430 586 446 620 L460 660 Z" fill="#45454C" />
        <Rect x="128" y="600" width="80" height="80" rx="14" fill="#5E5E66" />
        <Rect x="300" y="604" width="80" height="34" rx="8" fill="#F2A900" opacity={0.85} />
        <Line x1="372" y1="680" x2="423" y2="406" stroke="#45454C" strokeWidth={36} strokeLinecap="round" />
        <G transform="translate(262,598) rotate(-50)">
          <Rect x="-40" y="-40" width="400" height="80" rx="18" fill="url(#cmSd)" />
          <Rect x="340" y="-31" width="190" height="62" rx="12" fill="#45454C" />
          <Rect x="510" y="-24" width="150" height="48" rx="10" fill="url(#cmSd)" />
          <Circle cx="655" cy="0" r="34" fill="#2E2E33" />
          <Circle cx="655" cy="0" r="12" fill="#FFC21A" />
          <Rect x="-20" y="-40" width="370" height="12" rx="6" fill="#ffffff" opacity={0.45} />
          <Circle cx="0" cy="0" r="26" fill="#FFC21A" />
        </G>
        <Line x1="683" y1="116" x2="683" y2="440" stroke="#2E2E33" strokeWidth={8} />
        <Rect x="653" y="434" width="60" height="52" rx="12" fill="url(#cmSd)" />
        <Circle cx="683" cy="456" r="9" fill="#FFC21A" />
        <G transform="translate(683,484) scale(0.42)">
          <Rect x="-22" y="0" width="44" height="40" rx="8" fill="#45454C" />
          <Rect x="-46" y="34" width="92" height="30" rx="12" fill="url(#cmSd)" />
          <Path d="M0 60 V112 A92 92 0 1 1 -92 204 L-92 168" fill="none" stroke="#2E2E33" strokeWidth={50} strokeLinecap="round" strokeLinejoin="round" />
        </G>
        {[270, 400, 640, 770].map((x) => (
          <G key={x}>
            <Circle cx={x} cy="790" r="54" fill="#1F1F23" />
            <Circle cx={x} cy="790" r="20" fill="#FFC21A" />
          </G>
        ))}
      </G>
    </Svg>
  );
}
