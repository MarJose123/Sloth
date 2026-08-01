/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import "@/global.css";
import { useEffect, useCallback, useState } from "react";
import { Redirect, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { Toaster } from "sonner-native";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useIdleLock, recordActivity } from "@/hooks/useIdleLock";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { storage } from "@/lib/storage";
import {
  isPinRecovery,
  isSessionUnlocked,
  shouldLockGate,
  type LockGateState,
} from "@/lib/sessionLock";

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
  const pathname = usePathname();

  // Lock the app after 15 minutes without user activity. Touches anywhere in
  // the app reset the timer via the onTouchStart wrapper in the render below.
  useIdleLock();

  // ── cold-start lock gate ────────────────────────────────────────────────────
  // Backstop for the boot routing in src/app/index.tsx: a deep link straight
  // into a screen (e.g. sloth:///(app)/dashboard) never mounts the index
  // route, so the gate lives here at the root. Once the user unlocks, the
  // session flag keeps the gate open for the rest of this JS session.
  const [authGate, setAuthGate] = useState<LockGateState>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [onboardingComplete, hasUnlockMethod] = await Promise.all([
        storage.getOnboardingComplete(),
        storage.hasUnlockMethod(),
      ]);
      if (cancelled) return;
      setAuthGate(onboardingComplete && hasUnlockMethod ? "locked" : "open");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Post-unlock landing is deliberately /(app)/dashboard: a cold-start deep
  // link is redirected to /lock and its original target is discarded — a
  // locked device must not auto-open an arbitrary screen.
  const mustLock = shouldLockGate({
    authGate,
    pathname,
    sessionUnlocked: isSessionUnlocked(),
    pinRecovery: isPinRecovery(),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && authGate !== "checking") {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authGate]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded || authGate === "checking") return null;

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }} onTouchStart={recordActivity}>
            {mustLock ? (
              <Redirect href="/lock" />
            ) : (
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
                  name="edit-account"
                  options={{
                    animation: "slide_from_right",
                    animationDuration: 300,
                  }}
                />
                <Stack.Screen
                  name="add-category"
                  options={{
                    animation: "slide_from_right",
                    animationDuration: 300,
                  }}
                />
                <Stack.Screen
                  name="edit-category"
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
                  name="add-transaction"
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
                  options={{
                    presentation: "transparentModal",
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="select-account"
                  options={{
                    presentation: "transparentModal",
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="select-category"
                  options={{
                    presentation: "transparentModal",
                    animation: "fade",
                  }}
                />
              </Stack>
            )}
            <Toaster
              position="top-center"
              visibleToasts={3}
              gap={8}
              pauseWhenPageIsHidden
            />
          </View>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
