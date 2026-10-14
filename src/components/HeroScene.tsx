import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

// Home screen illustration: a site at dusk with a mobile crane lifting a beam onto a building under construction.
// Drawn on a 400-wide canvas with extra sky above and ground below, cropped from the bottom to fill the hero box.
export function HeroScene({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 -200 400 720" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE58A" />
          <Stop offset="0.55" stopColor="#FFF3CC" />
          <Stop offset="1" stopColor="#FBF8F1" />
        </LinearGradient>
        <LinearGradient id="boom" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFC21A" />
          <Stop offset="1" stopColor="#F2A900" />
        </LinearGradient>
        <LinearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E9E0CC" />
          <Stop offset="1" stopColor="#D8CCB2" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={-200} width={400} height={720} fill="url(#sky)" />
      <Circle cx={318} cy={92} r={46} fill="#FFFFFF" opacity={0.55} />
      <Circle cx={318} cy={92} r={30} fill="#FFFFFF" opacity={0.7} />

      {/* far skyline */}
      <G fill="#E7DCC3">
        <Rect x={-4} y={250} width={46} height={150} />
        <Rect x={38} y={210} width={34} height={190} />
        <Rect x={70} y={268} width={40} height={132} />
        <Rect x={300} y={230} width={36} height={170} />
        <Rect x={334} y={196} width={30} height={204} />
        <Rect x={362} y={256} width={44} height={144} />
      </G>
      <G fill="#F6F0E2">
        {[0, 1, 2, 3, 4, 5, 6].map((r) => (
          <G key={r}>
            <Rect x={46} y={222 + r * 22} width={6} height={9} />
            <Rect x={58} y={222 + r * 22} width={6} height={9} />
            <Rect x={342} y={208 + r * 24} width={6} height={9} />
            <Rect x={352} y={208 + r * 24} width={6} height={9} />
          </G>
        ))}
      </G>

      {/* tower crane in the background */}
      <G stroke="#9C9283" strokeWidth={2} fill="none">
        <Line x1={96} y1={400} x2={96} y2={96} />
        <Line x1={110} y1={400} x2={110} y2={96} />
        {Array.from({ length: 15 }, (_, i) => (
          <Line key={i} x1={96} y1={400 - i * 20} x2={110} y2={380 - i * 20} />
        ))}
        <Line x1={40} y1={96} x2={270} y2={96} />
        <Line x1={60} y1={86} x2={270} y2={86} />
        {Array.from({ length: 11 }, (_, i) => (
          <Line key={i} x1={60 + i * 20} y1={86} x2={70 + i * 20} y2={96} />
        ))}
        <Line x1={103} y1={70} x2={60} y2={86} />
        <Line x1={103} y1={70} x2={240} y2={86} />
        <Line x1={103} y1={70} x2={103} y2={96} />
        <Line x1={210} y1={96} x2={210} y2={150} strokeWidth={1.2} />
      </G>
      <Rect x={40} y={92} width={22} height={14} fill="#9C9283" />
      <Rect x={204} y={150} width={12} height={8} fill="#9C9283" />

      {/* building under construction */}
      <G>
        <Rect x={178} y={232} width={150} height={168} fill="#C9BEA8" />
        {[0, 1, 2, 3, 4].map((r) => (
          <G key={r}>
            <Rect x={178} y={232 + r * 34} width={150} height={6} fill="#B3A790" />
            {[0, 1, 2, 3, 4].map((c) => (
              <Rect key={c} x={188 + c * 28} y={244 + r * 34} width={18} height={18} fill="#EFE7D6" opacity={r === 0 ? 0.5 : 1} />
            ))}
          </G>
        ))}
        {/* columns sticking out of the top floor */}
        {[180, 214, 248, 282, 316].map((x) => (
          <Rect key={x} x={x} y={208} width={8} height={26} fill="#B3A790" />
        ))}
        <Rect x={176} y={204} width={156} height={5} fill="#8E836E" />
      </G>

      {/* mobile crane */}
      <G>
        {/* boom */}
        <Polygon points="118,352 128,344 262,150 254,146" fill="url(#boom)" stroke="#2B2B2E" strokeWidth={2} strokeLinejoin="round" />
        <Line x1={150} y1={302} x2={238} y2={174} stroke="#2B2B2E" strokeWidth={1.2} opacity={0.5} />
        <Line x1={258} y1={148} x2={258} y2={214} stroke="#2B2B2E" strokeWidth={1.6} />
        <Circle cx={258} cy={148} r={5} fill="#2B2B2E" />
        {/* hook block and beam */}
        <Rect x={251} y={212} width={14} height={14} rx={3} fill="#2B2B2E" />
        <Path d="M258 226 v6 a5 5 0 1 0 5 5" stroke="#2B2B2E" strokeWidth={2.5} fill="none" />
        <Path d="M258 238 L226 256 M258 238 L290 256" stroke="#5A564F" strokeWidth={1.5} />
        <Rect x={214} y={256} width={88} height={10} fill="#E06A10" stroke="#2B2B2E" strokeWidth={1.5} />
        <Rect x={214} y={259} width={88} height={2} fill="#2B2B2E" opacity={0.35} />
        {/* carrier */}
        <Rect x={46} y={356} width={150} height={26} rx={4} fill="#FFC21A" stroke="#2B2B2E" strokeWidth={2} />
        <Rect x={150} y={330} width={44} height={28} rx={4} fill="#FFC21A" stroke="#2B2B2E" strokeWidth={2} />
        <Rect x={160} y={336} width={26} height={13} rx={2} fill="#4A4A52" />
        <Rect x={92} y={336} width={50} height={22} rx={3} fill="#2B2B2E" />
        <Rect x={98} y={341} width={16} height={10} rx={2} fill="#FFF3CC" opacity={0.8} />
        <Rect x={30} y={378} width={186} height={6} fill="#2B2B2E" />
        <Rect x={26} y={384} width={8} height={18} fill="#2B2B2E" />
        <Rect x={212} y={384} width={8} height={18} fill="#2B2B2E" />
        <Rect x={18} y={400} width={24} height={5} fill="#5A564F" />
        <Rect x={204} y={400} width={24} height={5} fill="#5A564F" />
        {[70, 100, 150, 180].map((x) => (
          <G key={x}>
            <Circle cx={x} cy={392} r={12} fill="#2B2B2E" />
            <Circle cx={x} cy={392} r={5} fill="#8C857C" />
          </G>
        ))}
      </G>

      {/* ground */}
      <Rect x={0} y={402} width={400} height={118} fill="url(#ground)" />
      <Line x1={0} y1={402} x2={400} y2={402} stroke="#B8AC93" strokeWidth={2} />
      {/* cones */}
      {[300, 340].map((x) => (
        <G key={x}>
          <Polygon points={`${x - 7},420 ${x + 7},420 ${x + 2},398 ${x - 2},398`} fill="#E06A10" />
          <Rect x={x - 5} y={406} width={10} height={4} fill="#FFFFFF" />
          <Rect x={x - 10} y={420} width={20} height={4} fill="#2B2B2E" />
        </G>
      ))}
    </Svg>
  );
}
