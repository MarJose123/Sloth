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
 * Tests for src/lib/sessionLock.ts
 *
 * In-memory session unlock flag backing the cold-start lock gate.
 */

import {
  clearPinRecovery,
  isPinRecovery,
  isSessionUnlocked,
  markPinRecovery,
  markSessionUnlocked,
  resetSessionLock,
  shouldLockGate,
  type LockGateState,
} from "@/lib/sessionLock";

const LOCKED: LockGateState = "locked";

describe("sessionLock", () => {
  beforeEach(() => {
    resetSessionLock();
  });

  it("starts locked (not unlocked) by default", () => {
    expect(isSessionUnlocked()).toBe(false);
  });

  it("returns true after markSessionUnlocked", () => {
    markSessionUnlocked();
    expect(isSessionUnlocked()).toBe(true);
  });

  it("returns false again after resetSessionLock", () => {
    markSessionUnlocked();
    resetSessionLock();
    expect(isSessionUnlocked()).toBe(false);
  });
});

describe("sessionLock pin recovery", () => {
  beforeEach(() => {
    resetSessionLock();
  });

  it("is inactive by default", () => {
    expect(isPinRecovery()).toBe(false);
  });

  it("is active after markPinRecovery", () => {
    markPinRecovery();
    expect(isPinRecovery()).toBe(true);
  });

  it("clears after clearPinRecovery", () => {
    markPinRecovery();
    clearPinRecovery();
    expect(isPinRecovery()).toBe(false);
  });
});

describe("shouldLockGate", () => {
  const base = {
    authGate: LOCKED,
    pathname: "/(app)/dashboard",
    sessionUnlocked: false,
    pinRecovery: false,
  } as const;

  it("locks a cold-start deep link into an app screen", () => {
    expect(shouldLockGate(base)).toBe(true);
  });

  it("never locks the lock screen itself", () => {
    expect(shouldLockGate({ ...base, pathname: "/lock" })).toBe(false);
  });

  it("lets /pin-setup through only during an active recovery flow", () => {
    expect(shouldLockGate({ ...base, pathname: "/pin-setup" })).toBe(true);
    expect(
      shouldLockGate({ ...base, pathname: "/pin-setup", pinRecovery: true }),
    ).toBe(false);
  });

  it("does not lock once the session is unlocked", () => {
    expect(shouldLockGate({ ...base, sessionUnlocked: true })).toBe(false);
  });

  it("does not lock while the gate is still resolving or open", () => {
    expect(shouldLockGate({ ...base, authGate: "checking" })).toBe(false);
    expect(shouldLockGate({ ...base, authGate: "open" })).toBe(false);
  });
});
