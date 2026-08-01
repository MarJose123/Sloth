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

import { useEffect } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import { isSessionUnlocked, lockSession } from "@/lib/sessionLock";
import { isIdleElapsed } from "@/lib/idleLock";

/** How often the idle check runs while the app is open. */
const CHECK_INTERVAL_MS = 30 * 1000;

let lastActivity = Date.now();

/** Call on any user interaction (touch, app returning to foreground). */
export function recordActivity(): void {
  lastActivity = Date.now();
}

/**
 * Starts the idle-lock timer. Fires `listener` once after IDLE_TIMEOUT_MS of
 * no recorded activity, then resets so it can fire again. Returns a cleanup
 * function that stops the timer.
 */
export function startIdleLock(listener: () => void): () => void {
  recordActivity();
  const intervalId = setInterval(() => {
    if (isIdleElapsed(lastActivity, Date.now())) {
      recordActivity(); // reset so we don't fire again on the next tick
      listener();
    }
  }, CHECK_INTERVAL_MS);
  return () => clearInterval(intervalId);
}

/**
 * Mount once in the root layout. Locks the session and navigates to /lock
 * after IDLE_TIMEOUT_MS without user activity.
 *
 * Background handling: on iOS the interval is suspended while backgrounded, so
 * the check runs when the app returns to the foreground — if the idle timeout
 * elapsed during the absence the app locks immediately; a brief blip (under
 * the timeout) just resets the timer. On Android the interval keeps ticking
 * and may lock while backgrounded, which is equivalent.
 */
export function useIdleLock(): void {
  useEffect(() => {
    const stop = startIdleLock(() => {
      if (!isSessionUnlocked()) return; // already locked, or no lock configured
      lockSession();
      router.replace("/lock");
    });

    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (isIdleElapsed(lastActivity, Date.now())) {
        // Absent longer than the idle timeout — lock on return.
        if (isSessionUnlocked()) {
          lockSession();
          router.replace("/lock");
        }
      } else {
        // Brief background blip — count the return as activity.
        recordActivity();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, []);
}
