import { View } from 'react-native';

interface StepDotsProps {
    total: number;
    activeIndex: number;
}

export function StepDots({ total, activeIndex }: StepDotsProps) {
    return (
        <View className="my-5 flex-row justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    className={
                        i === activeIndex
                            ? 'h-1.5 w-[18px] rounded-full bg-brass'
                            : 'h-1.5 w-1.5 rounded-full bg-parchment/20'
                    }
                />
            ))}
        </View>
    );
}
