import { Stack } from 'expo-router';

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: false, // force forward-only progression through onboarding
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#1B1F1A' },
            }}
        >
            <Stack.Screen name="welcome" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="biometric" />
            <Stack.Screen name="pin-setup" />
        </Stack>
    );
}
