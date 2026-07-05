import { View, Text, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { DialFrame } from '@/components/DialFrame';
import { SlothMark } from '@/components/SlothMark';
import { StepDots } from '@/components/StepDots';
import { BrassButton } from '@/components/ui/BrassButton';

export default function WelcomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-ink px-5 pb-7 pt-3">
            <View className="flex-1">
                <Text className="mb-8 text-center font-mono text-xs uppercase tracking-[2px] text-brass">
                    Sloth
                </Text>

                <DialFrame size={132} innerSize={56}>
                    <SlothMark size={34} />
                </DialFrame>

                <Text className="mt-8 text-center font-serif text-[30px] leading-[36px] text-parchment">
                    Your money.{'\n'}Your device.{'\n'}Nobody else&apos;s.
                </Text>

                <Text className="mt-3.5 px-2 text-center text-sm leading-[21px] text-parchment-dim">
                    No bank logins. No third-party servers reading your transactions.
                    Everything lives here, encrypted, and never leaves this device.
                </Text>
            </View>

            <StepDots total={3} activeIndex={0} />
            <BrassButton label="Continue" onPress={() => router.push('/onboarding/privacy')} />
        </SafeAreaView>
    );
}
