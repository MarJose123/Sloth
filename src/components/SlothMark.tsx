import Svg, { Circle, Path, Ellipse } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface SlothMarkProps {
    size?: number;
    color?: string;
}

/** Line-art sloth face used on Splash, Onboarding, and the Lock screen dial. */
export function SlothMark({ size = 34, color = colors.brass }: SlothMarkProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
            <Circle cx={32} cy={34} r={20} stroke={color} strokeWidth={2.2} />
            <Circle cx={23} cy={30} r={6} stroke={color} strokeWidth={2.2} />
            <Circle cx={41} cy={30} r={6} stroke={color} strokeWidth={2.2} />
            <Circle cx={23} cy={30} r={1.6} fill={color} />
            <Circle cx={41} cy={30} r={1.6} fill={color} />
            <Path
                d="M27 42 Q32 46 37 42"
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
            />
            <Ellipse cx={32} cy={38} rx={3.2} ry={2.2} fill={color} />
        </Svg>
    );
}
