import "@/global.css";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAppFonts } from "@/hooks/useAppFonts";

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
    <View className="flex-1 bg-ink">
      <Stack screenOptions={{ headerShown: false }}>
        {/* ── Core groups ── */}
        <Stack.Screen name="(app)" />
        <Stack.Screen name="onboarding" />

        {/* ── Root-level push screens (no tab bar) ── */}
        <Stack.Screen name="add-account" />
        <Stack.Screen name="category-editor" />
        <Stack.Screen name="transaction/new" />
        <Stack.Screen name="about" />
        <Stack.Screen name="receipt-scan" />
        <Stack.Screen name="import" />
        <Stack.Screen name="lock" />
        <Stack.Screen name="donate" />
        <Stack.Screen name="fab-sheet" />
      </Stack>
    </View>
  );
}
