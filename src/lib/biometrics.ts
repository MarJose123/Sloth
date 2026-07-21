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

import * as LocalAuthentication from "expo-local-authentication";
import type { BiometricAvailability } from "@/types";

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return { available: false, reason: "no_hardware" };

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return { available: false, reason: "not_enrolled" };

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const type = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  )
    ? "facial"
    : types.includes(LocalAuthentication.AuthenticationType.IRIS)
      ? "iris"
      : "fingerprint";

  return { available: true, type };
}

export async function authenticateWithBiometrics(
  promptMessage = "Unlock Sloth",
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Use PIN instead",
    disableDeviceFallback: true, // we handle PIN fallback with our own screen
  });
  return result.success;
}
