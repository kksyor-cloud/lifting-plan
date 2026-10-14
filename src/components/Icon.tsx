import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Line icons drawn with react-native-svg (24x24 grid, 2px stroke).
export type IconName = 'home' | 'info' | 'sheet' | 'history' | 'menu' | 'trash' | 'chevron' | 'pencil' | 'down' | 'save' | 'share' | 'mail' | 'plus' | 'megaphone';

export function Icon({ name, size = 24, color = '#2B2B2E' }: { name: IconName; size?: number; color?: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' ? <Path {...p} fill={color} stroke="none" d="M12 3.2 2.8 11h2.7v9h5v-5.5h3V20h5v-9h2.7z" /> : null}
      {name === 'info' ? (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M12 11v6M12 7.5v.2" />
        </>
      ) : null}
      {name === 'sheet' ? (
        <>
          <Rect {...p} x={5} y={4} width={14} height={17} rx={2} />
          <Path {...p} d="M9 3h6v3H9zM8.5 10.5h7M8.5 14h7M8.5 17.5h4" />
        </>
      ) : null}
      {name === 'history' ? (
        <>
          <Path {...p} d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
          <Path {...p} d="M3 4v4h4M12 7.5V12l3 2" />
        </>
      ) : null}
      {name === 'menu' ? <Path {...p} d="M4 7h16M4 12h16M4 17h16" /> : null}
      {name === 'trash' ? (
        <>
          <Path {...p} d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13" />
          <Path {...p} d="M10.5 11v5.5M13.5 11v5.5" />
        </>
      ) : null}
      {name === 'chevron' ? <Path {...p} d="m9 5 7 7-7 7" /> : null}
      {name === 'down' ? <Path {...p} d="m6 9 6 6 6-6" /> : null}
      {name === 'pencil' ? <Path {...p} d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /> : null}
      {name === 'save' ? <Path {...p} d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" /> : null}
      {name === 'share' ? <Path {...p} d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v8h14v-8" /> : null}
      {name === 'mail' ? (
        <>
          <Rect {...p} x={3} y={5} width={18} height={14} rx={2} />
          <Path {...p} d="m3.5 6 8.5 7 8.5-7" />
        </>
      ) : null}
      {name === 'plus' ? <Path {...p} d="M12 5v14M5 12h14" /> : null}
      {name === 'megaphone' ? <Path {...p} d="M4 10v4h3l7 4V6l-7 4zM17 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5l-1-4.5" /> : null}
    </Svg>
  );
}
