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

/**
 * Tests for src/lib/storage.ts
 *
 * expo-secure-store is mocked in setup.ts with an in-memory record that
 * persists across tests in this file, so each test resets the keys it
 * exercises.
 */

import { storage } from "@/lib/storage";

describe("storage.hasUnlockMethod", () => {
  beforeEach(async () => {
    await storage.removePinHash();
    await storage.setBiometricEnabled(false);
  });

  it("returns false when neither a PIN nor biometrics are configured", async () => {
    expect(await storage.hasUnlockMethod()).toBe(false);
  });

  it("returns true when a PIN hash is set", async () => {
    await storage.setPinHash("hashed:sloth-pin-salt:123456");
    expect(await storage.hasUnlockMethod()).toBe(true);
  });

  it("returns true when biometrics are enabled", async () => {
    await storage.setBiometricEnabled(true);
    expect(await storage.hasUnlockMethod()).toBe(true);
  });

  it("returns true when both are configured", async () => {
    await storage.setPinHash("hashed:sloth-pin-salt:123456");
    await storage.setBiometricEnabled(true);
    expect(await storage.hasUnlockMethod()).toBe(true);
  });

  it("returns false after the PIN is removed and biometrics disabled", async () => {
    await storage.setPinHash("hashed:sloth-pin-salt:123456");
    await storage.setBiometricEnabled(true);
    await storage.removePinHash();
    await storage.setBiometricEnabled(false);
    expect(await storage.hasUnlockMethod()).toBe(false);
  });
});
