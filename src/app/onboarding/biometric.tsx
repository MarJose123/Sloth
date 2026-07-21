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

// Biometric setup is now part of the unified onboarding carousel in welcome.tsx.
// This file exists only for deep-link compatibility — redirect to the carousel.
import { Redirect } from "expo-router";
export default function BiometricRedirect() {
  return <Redirect href="/onboarding/welcome" />;
}
