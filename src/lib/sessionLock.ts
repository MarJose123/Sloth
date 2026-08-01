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
 * In-memory "unlocked this session" flag for the app-lock gate.
 *
 * The lock gate (root layout + boot routing) asks "does the user have an
 * unlock method AND have they not yet unlocked in this JS session?". This
 * module answers the second half. It is deliberately NOT persisted: a cold
 * start (fresh JS context) always starts locked, which is the security
 * property the app needs.
 */
let unlocked = false;
let pinRecoveryActive = false;

export type LockGateState = "checking" | "locked" | "open";

/**
 * Pure decision for the root cold-start lock gate. Lives here (instead of
 * inline in the root layout) so the security policy is unit-testable.
 *
 * The gate lets through:
 *  - anything while the gate is still resolving ("checking") or open;
 *  - the /lock screen itself (it IS the gate);
 *  - /pin-setup, but ONLY when the lock screen explicitly started a backup-PIN
 *    recovery flow this session (markPinRecovery) — a raw cold-start deep link
 *    to /pin-setup must be blocked, or the PIN could be overwritten without
 *    unlocking;
 *  - everything once the user has unlocked this session.
 */
export function shouldLockGate({
  authGate,
  pathname,
  sessionUnlocked,
  pinRecovery,
}: {
  authGate: LockGateState;
  pathname: string;
  sessionUnlocked: boolean;
  pinRecovery: boolean;
}): boolean {
  return (
    authGate === "locked" &&
    pathname !== "/lock" &&
    !(pathname === "/pin-setup" && pinRecovery) &&
    !sessionUnlocked
  );
}

export function markSessionUnlocked(): void {
  unlocked = true;
}

/**
 * Locks the session (idle timeout, manual lock). Clears the unlock flag and
 * any in-flight PIN-recovery marker so the gate re-engages.
 */
export function lockSession(): void {
  unlocked = false;
  pinRecoveryActive = false;
}

export function isSessionUnlocked(): boolean {
  return unlocked;
}

/**
 * Marks the backup-PIN recovery flow as active. Called by the lock screen
 * immediately before pushing /pin-setup, so the root lock gate lets that one
 * screen through while the user is stranded (biometrics lost, no PIN yet).
 * Deliberately scoped to the session and tied to navigation origin — a raw
 * cold-start deep link to /pin-setup must NOT be allowed, or an attacker
 * could overwrite the PIN without unlocking.
 */
export function markPinRecovery(): void {
  pinRecoveryActive = true;
}

/** Cleared when the lock screen regains focus (recovery flow ended). */
export function clearPinRecovery(): void {
  pinRecoveryActive = false;
}

export function isPinRecovery(): boolean {
  return pinRecoveryActive;
}

/** Test helper only — resets the flags for a fresh scenario. */
export function resetSessionLock(): void {
  unlocked = false;
  pinRecoveryActive = false;
}
