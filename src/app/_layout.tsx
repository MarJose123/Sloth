import "@/global.css";
import { useEffect, useCallback } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// ─── Theme-aware status bar ─────────────────────────────────────────

function ThemedStatusBar() {
  const { resolved } = useTheme();
  return <StatusBar style={resolved === "dark" ? "light" : "dark"} animated />;
}

// ─── Root Layout ─────────────────────────────────────────────────────

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
      <ThemedStatusBar />
      <ErrorBoundary>
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
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="category-editor"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="receipt-scan"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="import"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="lock"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="pin-setup"
              options={{
                animation: "slide_from_right",
                animationDuration: 300,
              }}
            />
            <Stack.Screen
              name="fab-sheet"
              options={{ presentation: "transparentModal", animation: "fade" }}
            />
          </Stack>
        </View>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
