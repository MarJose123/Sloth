import { View } from 'react-native';

interface PinDotsProps {
    length: number;
    filledCount: number;
}

export function PinDots({ length, filledCount }: PinDotsProps) {
    return (
        <View className="mb-10 flex-row justify-center gap-4">
            {Array.from({ length }).map((_, i) => (
                <View
                    key={i}
                    className={`h-3.5 w-3.5 rounded-full border-[1.5px] ${
                        i < filledCount ? 'border-brass bg-brass' : 'border-brass/50'
                    }`}
                />
            ))}
        </View>
    );
}
