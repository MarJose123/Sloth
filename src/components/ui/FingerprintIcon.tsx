import Svg, { Path, Ellipse, G } from "react-native-svg";
import { useColors } from "@/theme/ThemeContext";

interface FingerprintIconProps {
  size?: number;
  color?: string;
}

/**
 * A stylised fingerprint SVG icon.
 * Defaults to brass but accepts an explicit colour override.
 */
export function FingerprintIcon({
  size = 78,
  color: explicitColor,
}: FingerprintIconProps) {
  const colors = useColors();
  const strokeColor = explicitColor ?? colors.brass;

  return (
    <Svg width={size} height={size} viewBox="0 0 78 78" fill="none">
      <G stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round">
        <Path d="M39 28C34 28 30 32 30 37V41" />
        <Path d="M39 22C30 22 23 29 23 38V42" />
        <Path d="M39 34C37 34 36 35 36 37V49" />
        <Path d="M39 16C26 16 16 26 16 39V45" />
        <Path d="M48 37C48 32 44 28 39 28" />
        <Path d="M55 38C55 29 48 22 39 22" />
        <Path d="M62 39C62 26 52 16 39 16" />
        <Path d="M39 40V55" />
        <Path d="M42 40V52" />
        <Path d="M36 40V46" />
        <Ellipse cx={39} cy={60} rx={3} ry={2} />
      </G>
    </Svg>
  );
}
