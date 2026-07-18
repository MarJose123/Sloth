import "@/global.css";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ThemeProvider } from "@/theme/ThemeContext";

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
    <ThemeProvider>
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* ── Core groups ── */}
          <Stack.Screen name="(app)" />
          <Stack.Screen name="onboarding" />

          {/* ── Root-level push screens (no tab bar) ── */}
          <Stack.Screen
            name="add-account"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="category-editor"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="transaction/new"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="about"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="receipt-scan"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="import"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="lock"
            options={{ animation: "slide_from_right", animationDuration: 300 }}
          />
          <Stack.Screen
            name="fab-sheet"
            options={{ presentation: "transparentModal", animation: "fade" }}
          />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
