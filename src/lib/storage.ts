import * as SecureStore from "expo-secure-store";

import type { ThemePreference } from "@/types";

/**
 * Wraps expo-secure-store for small boolean/string flags (onboarding state,
 * biometric preference, theme preference, screenshots flag).
 *
 * This is NOT where the SQLCipher database key lives — that is a separate,
 * longer-lived Keychain/Keystore entry managed by db/key.ts.
 */
const KEYS = {
  onboardingComplete: "sloth.onboarding_complete",
  biometricEnabled: "sloth.biometric_enabled",
  pinHash: "sloth.pin_hash",
  themePreference: "sloth.theme_preference",
  screenshotsEnabled: "sloth.screenshots_enabled",
} as const;

export const storage = {
  // ── onboarding ──────────────────────────────────────────────────────────────

  async getOnboardingComplete(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.onboardingComplete)) === "true";
  },
  async setOnboardingComplete(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.onboardingComplete, String(value));
  },

  // ── biometrics ──────────────────────────────────────────────────────────────

  async getBiometricEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.biometricEnabled)) === "true";
  },
  async setBiometricEnabled(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.biometricEnabled, String(value));
  },

  // ── PIN ─────────────────────────────────────────────────────────────────────

  async setPinHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.pinHash, hash);
  },
  async getPinHash(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.pinHash);
  },
  async removePinHash(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.pinHash);
  },

  // ── theme ───────────────────────────────────────────────────────────────────

  /** Returns "auto" when no preference has been stored (follow system). */
  async getThemePreference(): Promise<ThemePreference> {
    return (
      ((await SecureStore.getItemAsync(
        KEYS.themePreference,
      )) as ThemePreference) ?? "auto"
    );
  },
  async setThemePreference(value: ThemePreference): Promise<void> {
    await SecureStore.setItemAsync(KEYS.themePreference, value);
  },

  // ── screenshots ─────────────────────────────────────────────────────────────

  /**
   * Defaults to false (screenshots blocked) — the secure default.
   * Applying this at the native layer (FLAG_SECURE on Android) requires a
   * config plugin or native module; the setting is stored here and read by
   * that layer when it exists.
   */
  async getScreenshotsEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.screenshotsEnabled)) === "true";
  },
  async setScreenshotsEnabled(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.screenshotsEnabled, String(value));
  },
};
