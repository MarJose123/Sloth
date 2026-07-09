// Biometric setup is now part of the unified onboarding carousel in welcome.tsx.
// This file exists only for deep-link compatibility — redirect to the carousel.
import { Redirect } from "expo-router";
export default function BiometricRedirect() {
  return <Redirect href="/onboarding/welcome" />;
}
