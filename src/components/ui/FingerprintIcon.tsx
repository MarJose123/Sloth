import { Lucide } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";

interface FingerprintIconProps {
  size?: number;
  color?: string;
}

/**
 * Fingerprint icon using Lucide's `fingerprint` glyph.
 * Defaults to the theme's brass stroke colour but accepts an explicit override.
 */
export function FingerprintIcon({
  size = 24,
  color: explicitColor,
}: FingerprintIconProps) {
  const colors = useColors();
  const strokeColor = explicitColor ?? colors.brass;

  return <Lucide name="fingerprint" size={size} color={strokeColor} />;
}
