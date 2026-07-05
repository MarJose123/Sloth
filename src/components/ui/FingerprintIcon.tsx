import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';

interface FingerprintIconProps {
    size?: number;
    color?: string;
}

export function FingerprintIcon({ size = 30, color = colors.brass }: FingerprintIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4}>
            <Path d="M12 2a7 7 0 0 0-7 7c0 3 1 5 1 8" strokeLinecap="round" />
            <Path d="M12 2a7 7 0 0 1 7 7c0 2-.3 3.5-.8 5" strokeLinecap="round" />
            <Path
                d="M9 21c1-2 1.2-4 1.2-6a1.8 1.8 0 1 1 3.6 0c0 1 0 2-.3 3"
                strokeLinecap="round"
            />
            <Path d="M6 17c.6-1.6.8-3 .8-5a5.2 5.2 0 0 1 10.4 0c0 1 0 1.6-.1 2.3" strokeLinecap="round" />
        </Svg>
    );
}
