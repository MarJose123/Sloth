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
 * Tests for src/lib/idleLock.ts
 *
 * Pure idle-timeout logic (the timer wiring in src/hooks/useIdleLock.ts is
 * not unit-tested).
 */

import { isIdleElapsed, IDLE_TIMEOUT_MS } from "@/lib/idleLock";

describe("IDLE_TIMEOUT_MS", () => {
  it("is 15 minutes", () => {
    expect(IDLE_TIMEOUT_MS).toBe(15 * 60 * 1000);
  });
});

describe("isIdleElapsed", () => {
  const now = 1_000_000_000_000;

  it("is false shortly after activity", () => {
    expect(isIdleElapsed(now - 1000, now)).toBe(false);
    expect(isIdleElapsed(now, now)).toBe(false);
  });

  it("is false just before the timeout", () => {
    expect(isIdleElapsed(now - IDLE_TIMEOUT_MS + 1, now)).toBe(false);
  });

  it("is true exactly at the timeout", () => {
    expect(isIdleElapsed(now - IDLE_TIMEOUT_MS, now)).toBe(true);
  });

  it("is true after the timeout", () => {
    expect(isIdleElapsed(now - IDLE_TIMEOUT_MS - 60_000, now)).toBe(true);
  });

  it("honours a custom timeout", () => {
    expect(isIdleElapsed(now - 5_000, now, 10_000)).toBe(false);
    expect(isIdleElapsed(now - 15_000, now, 10_000)).toBe(true);
  });
});
