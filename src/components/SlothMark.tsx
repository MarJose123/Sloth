import Svg, { Path } from "react-native-svg";
import { useColors } from "@/theme/ThemeContext";

interface SlothMarkProps {
  size?: number;
  color?: string;
}

/**
 * Simplified sloth icon mark — the curvaceous "S" monogram.
 * Defaults to brass but accepts an explicit colour override.
 */
export function SlothMark({
  size = 34,
  color: explicitColor,
}: SlothMarkProps) {
  const colors = useColors();
  const strokeColor = explicitColor ?? colors.brass;

  return (
    <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <Path
        d="M17 2C12 2 7 6 7 12C7 16 10 19 14 20C11 22 9 25 9 29C9 32 12 34 17 34C22 34 25 32 25 29C25 25 23 22 20 20C24 19 27 16 27 12C27 6 22 2 17 2Z"
        stroke={strokeColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
