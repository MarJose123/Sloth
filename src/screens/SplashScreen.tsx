import { View, Text } from 'react-native';
import { DialFrame } from '@/components/DialFrame';
import { SlothMark } from '@/components/SlothMark';

export function SplashScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-ink">
            <DialFrame size={104} innerSize={44}>
                <SlothMark size={28} />
            </DialFrame>

            <Text className="mt-1 font-serif text-2xl text-parchment">Sloth</Text>
            <Text className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[2px] text-parchment-dim">
                Private by default
            </Text>

            <View className="absolute bottom-16 flex-row gap-1.5 self-center">
                <View className="h-1.5 w-1.5 rounded-full bg-brass/35" />
                <View className="h-1.5 w-1.5 rounded-full bg-brass" />
                <View className="h-1.5 w-1.5 rounded-full bg-brass/35" />
            </View>
        </View>
    );
}
