import { Stack } from "expo-router";
import { lightColors } from "@/theme/lightColors";
import { StatusBar } from "expo-status-bar";

export default function OnboardingLayout() {
  return (
    <>
      <StatusBar style={"dark"} />
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
