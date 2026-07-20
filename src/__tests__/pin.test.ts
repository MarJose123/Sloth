/**
 * Tests for src/lib/pin.ts
 *
 * PIN hashing and validation utilities.
 * hashPin uses expo-crypto (mocked in setup.ts).
 */

import { hashPin, isValidPinFormat } from "@/lib/pin";

// ─── isValidPinFormat ──────────────────────────────────────────────────────

describe("isValidPinFormat", () => {
  it("accepts exactly 6 digits", () => {
    expect(isValidPinFormat("123456")).toBe(true);
    expect(isValidPinFormat("000000")).toBe(true);
  });

  it("rejects non-digit characters", () => {
    expect(isValidPinFormat("12345a")).toBe(false);
    expect(isValidPinFormat("12 456")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidPinFormat("12345")).toBe(false);
    expect(isValidPinFormat("1234567")).toBe(false);
    expect(isValidPinFormat("")).toBe(false);
  });
});

// ─── hashPin ───────────────────────────────────────────────────────────────

describe("hashPin", () => {
  it("returns a SHA-256 hash with app salt prefix", async () => {
    const hash = await hashPin("123456");
    expect(hash).toBe("hashed:sloth-pin-salt:123456");
  });

  it("produces different hashes for different PINs", async () => {
    const hash1 = await hashPin("111111");
    const hash2 = await hashPin("222222");
    expect(hash1).not.toBe(hash2);
  });
});
