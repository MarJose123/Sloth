import "../global.css";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaListener } from "react-native-safe-area-context";
import { useAppFonts } from "@/hooks/useAppFonts";
import { Uniwind } from "uniwind";

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
    <SafeAreaListener
      onChange={({ insets }) => {
        Uniwind.updateInsets(insets);
      }}
    >
      <View className="flex-1 bg-ink">
        <Stack screenOptions={{ headerShown: false }}>
          {/* ── Core groups ── */}
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(app)" />

          {/* ── Root-level push screens (no tab bar) ── */}
          {/* Navigated to via router.push("/add-account") etc. from    */}
          {/* within (app) tabs; renders outside the tab layout so the  */}
          {/* tab bar is not visible on these screens.                  */}
          <Stack.Screen name="add-account" />
          <Stack.Screen name="category-editor" />
          <Stack.Screen name="about" />
          <Stack.Screen name="receipt-scan" />
          <Stack.Screen name="import" />
        </Stack>
      </View>
    </SafeAreaListener>
  );
}
