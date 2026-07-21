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

import { Stack } from "expo-router";
import { lightColors } from "@/theme/lightColors";

export default function OnboardingLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: "none", // Carousel manages its own transitions
          contentStyle: { backgroundColor: lightColors.surfaceBg },
        }}
      >
        {/* welcome.tsx hosts the full carousel (all 3 onboarding slides) */}
        <Stack.Screen name="welcome" />
        {/* pin-setup is a separate screen navigated to from the biometric slide */}
        <Stack.Screen
          name="pin-setup"
          options={{ animation: "slide_from_right" }}
        />
        {/* privacy and biometric kept for any deep-link compatibility — they redirect to welcome */}
        <Stack.Screen name="privacy" />
        <Stack.Screen name="biometric" />
      </Stack>
    </>
  );
}
