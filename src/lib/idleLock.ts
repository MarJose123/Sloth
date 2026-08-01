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
 * Pure idle-lock logic — no React Native imports, so it stays unit-testable.
 * The timer/wiring lives in src/hooks/useIdleLock.ts.
 */

/** Lock the app after this much time without any user activity. */
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Has the idle timeout elapsed since `lastActivity`?
 * @param lastActivity epoch ms of the last user interaction
 * @param now         current epoch ms
 * @param timeoutMs   idle threshold (defaults to IDLE_TIMEOUT_MS)
 */
export function isIdleElapsed(
  lastActivity: number,
  now: number,
  timeoutMs: number = IDLE_TIMEOUT_MS,
): boolean {
  return now - lastActivity >= timeoutMs;
}
