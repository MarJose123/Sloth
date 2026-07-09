import Svg, {
  Rect,
  Circle,
  Ellipse,
  Path,
  G,
} from "react-native-svg";

interface SlothAppIconProps {
  size?: number;
  borderRadius?: number;
}

/**
 * Full-color illustrated Sloth app icon.
 * Used on: Splash (Screen 00), Onboarding Welcome (Slide 1), About (Screen 18).
 * Matches the SVG symbol defined in the HTML mockup exactly.
 * NOT the same as SlothMark (which is the line-art biometric/dial motif).
 */
export function SlothAppIcon({ size = 112, borderRadius }: SlothAppIconProps) {
  const r = borderRadius ?? size * 0.215; // ~22% matches iOS icon corner radius
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {/* Background — moss green */}
      <Rect width={1024} height={1024} rx={220} fill="#7FA06B" />

      <G transform="translate(512,512) scale(0.8) translate(-512,-512)">
        {/* Ear patches */}
        <Circle cx={290} cy={300} r={92} fill="#7A5A3D" />
        <Circle cx={734} cy={300} r={92} fill="#7A5A3D" />

        {/* Head */}
        <Circle cx={512} cy={522} r={300} fill="#A9764F" />

        {/* Muzzle / face patch */}
        <Ellipse cx={512} cy={568} rx={212} ry={182} fill="#F3EEE1" />

        {/* Eye sockets */}
        <Ellipse cx={425} cy={500} rx={70} ry={86} fill="#3B2A1E" />
        <Ellipse cx={599} cy={500} rx={70} ry={86} fill="#3B2A1E" />

        {/* Eye glints */}
        <Circle cx={404} cy={474} r={16} fill="#F3EEE1" />
        <Circle cx={578} cy={474} r={16} fill="#F3EEE1" />

        {/* Brow arches (eye-patch circles) */}
        <Path
          d="M368 396 Q425 372 482 396"
          stroke="#7A5A3D"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M542 396 Q599 372 656 396"
          stroke="#7A5A3D"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />

        {/* Nose */}
        <Ellipse cx={512} cy={608} rx={30} ry={22} fill="#3B2A1E" />

        {/* Smile */}
        <Path
          d="M462 652 Q512 690 562 652"
          stroke="#3B2A1E"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
