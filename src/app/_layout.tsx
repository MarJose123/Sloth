import { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppFonts } from '@/hooks/useAppFonts';
import "../global.css"

// Keep the native splash mounted until fonts are ready; our custom
// SplashScreen component (with the sloth mark + tagline) then owns the UI
// during the async onboarding-status check performed in app/index.tsx.
SplashScreen.preventAutoHideAsync().catch(() => {
    /* no-op: safe to ignore if already hidden */
});

export default function RootLayout() {
    const fontsLoaded = useAppFonts();

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    useEffect(() => {
        onLayoutRootView();
    }, [onLayoutRootView]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <View className="flex-1 bg-ink">
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(app)" />
                </Stack>
            </View>
        </SafeAreaProvider>
    );
}
