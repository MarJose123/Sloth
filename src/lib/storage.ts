import * as SecureStore from "expo-secure-store";

/**
 * Wraps expo-secure-store for small boolean/string flags (onboarding state,
 * biometric preference). This is NOT where the SQLCipher database key lives —
 * that should be a separate, longer-lived Keychain/Keystore entry generated
 * once and unlocked by biometrics/PIN, not re-derived from these flags.
 */
const KEYS = {
  onboardingComplete: "sloth.onboarding_complete",
  biometricEnabled: "sloth.biometric_enabled",
  pinHash: "sloth.pin_hash",
} as const;

export const storage = {
  async getOnboardingComplete(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.onboardingComplete)) === "true";
  },
  async setOnboardingComplete(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.onboardingComplete, String(value));
  },

  async getBiometricEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEYS.biometricEnabled)) === "true";
  },
  async setBiometricEnabled(value: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEYS.biometricEnabled, String(value));
  },

  async setPinHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.pinHash, hash);
  },
  async getPinHash(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.pinHash);
  },
};
