/** Biometric authentication types. */

export type BiometricAvailability =
  | { available: true; type: "facial" | "fingerprint" | "iris" }
  | { available: false; reason: "no_hardware" | "not_enrolled" };
