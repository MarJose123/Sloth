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

import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { PinDots } from "@/components/ui/PinDots";
import { Keypad } from "@/components/Keypad";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { BrassButton } from "@/components/ui/BrassButton";
import { TextLink } from "@/components/ui/TextLink";
import { hashPin } from "@/lib/pin";
import { storage } from "@/lib/storage";
import {
  clearPinRecovery,
  isSessionUnlocked,
  markPinRecovery,
  markSessionUnlocked,
} from "@/lib/sessionLock";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometrics";

const PIN_LENGTH = 6;

const BIOMETRICS_LOST_MESSAGE =
  "Face ID / Touch ID is no longer available on this device. Set a backup PIN to get back in.";
const BIOMETRICS_FAILED_MESSAGE = "Biometric didn't match. Try again.";

type LockMode = "lock" | "set";
type ViewState =
  | { screen: "resolving" }
  | { screen: "biometric"; error?: string }
  | { screen: "pin_verify"; error?: string };

export default function LockScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  // "set" mode is only honored inside an already-unlocked session (a
  // settings-driven change-PIN flow). A cold-start deep link to
  // sloth://lock?mode=set must NOT be able to overwrite the PIN without
  // authenticating — it is forced into the normal unlock flow instead.
  const mode: LockMode =
    params.mode === "set" && isSessionUnlocked() ? "set" : "lock";

  const [view, setView] = useState<ViewState>({ screen: "resolving" });
  const [pinInput, setPinInput] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [bioUsable, setBioUsable] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // ── resolve unlock method on focus ─────────────────────────────────────────
  // useFocusEffect (not useEffect) so returning from the backup-PIN recovery
  // flow re-resolves and picks up the newly created PIN.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function resolveUnlockMethod() {
        clearPinRecovery();
        setView({ screen: "resolving" });

        if (mode === "set") {
          // Setting a new PIN — show PIN entry directly
          if (!cancelled) setView({ screen: "pin_verify" });
          return;
        }

        const [availability, biometricsEnabled, pinHash] = await Promise.all([
          checkBiometricAvailability(),
          storage.getBiometricEnabled(),
          storage.getPinHash(),
        ]);
        if (cancelled) return;

        const usable = availability.available && biometricsEnabled;
        const pinExists = pinHash !== null;
        setBioUsable(usable);
        setHasPin(pinExists);

        // No auto-prompt: land on the biometric screen so the user can
        // choose biometrics or PIN (when one exists) from the UI itself.
        setView(
          !usable
            ? pinExists
              ? { screen: "pin_verify" }
              : {
                  screen: "biometric",
                  error: BIOMETRICS_LOST_MESSAGE,
                }
            : { screen: "biometric" },
        );
      }

      resolveUnlockMethod();
      return () => {
        cancelled = true;
      };
    }, [mode]),
  );

  // ── PIN digit handler ────────────────────────────────────────────────────────
  const handleDigit = useCallback(
    async (digit: string) => {
      if (pinInput.length >= PIN_LENGTH) return;
      const next = pinInput + digit;
      setPinInput(next);

      if (next.length !== PIN_LENGTH) return;

      if (mode === "set") {
        // In set mode, we just return — parent handles redirect after pin-setup
        // This screen for "set" mode is used from settings to change PIN
        const hash = await hashPin(next);
        await storage.setPinHash(hash);
        router.back();
        return;
      }

      // lock mode — verify
      const storedHash = await storage.getPinHash();
      const inputHash = await hashPin(next);

      if (inputHash === storedHash) {
        markSessionUnlocked();
        router.replace("/(app)/dashboard");
      } else {
        // Shake animation trigger
        setShakeKey((k) => k + 1);
        setPinInput("");
      }
    },
    [pinInput, mode],
  );

  const handleBackspace = useCallback(() => {
    setPinInput((prev) => prev.slice(0, -1));
  }, []);

  const handleBiometricFallback = useCallback(async () => {
    const availability = await checkBiometricAvailability();
    if (!availability.available) return;
    const success = await authenticateWithBiometrics(
      "Unlock Sloth",
      hasPin ? "Use PIN instead" : "Cancel",
    );
    if (success) {
      markSessionUnlocked();
      router.replace("/(app)/dashboard");
    } else {
      setView({
        screen: "biometric",
        error: hasPin
          ? "Biometric didn't match. Try again or use your PIN."
          : BIOMETRICS_FAILED_MESSAGE,
      });
    }
  }, [hasPin]);

  // ── render ───────────────────────────────────────────────────────────────────

  if (view.screen === "resolving") {
    // Brief gate while the unlock method resolves — avoids flashing the wrong
    // screen (e.g. biometric UI for a PIN-only user).
    return <View className="flex-1 bg-surface-bg" />;
  }

  if (view.screen === "biometric") {
    const lockedOut = !bioUsable && !hasPin;
    return (
      <View className="flex-1 items-center justify-center px-5 bg-surface-bg">
        {/* Brass brand-mark */}
        <View className="mb-2">
          <Text className="text-center font-mono text-[12.5px] uppercase tracking-[2px] text-brass">
            Sloth
          </Text>
        </View>

        {/* Biometric ring with app logo */}
        <SlothAppIcon size={90} />

        <Text className="mb-2 mt-8 text-center font-fraunces-medium text-[24px] text-text-primary">
          Welcome back
        </Text>
        <Text className="mb-10 text-center text-[14.5px] text-text-secondary">
          Unlock to see your accounts
        </Text>

        {bioUsable ? (
          <>
            <BrassButton
              label="Unlock with Biometric"
              onPress={handleBiometricFallback}
            />
            {view.error && (
              <Text className="mt-4 text-center text-[12.5px] text-rust">
                {view.error}
              </Text>
            )}
          </>
        ) : lockedOut ? (
          <>
            <Text className="mb-4 text-center text-[12.5px] text-rust">
              {view.error ?? BIOMETRICS_LOST_MESSAGE}
            </Text>
            <TextLink
              label="Set a backup PIN"
              onPress={() => {
                markPinRecovery();
                router.push("/pin-setup");
              }}
            />
          </>
        ) : null}

        {hasPin && (
          <TextLink
            label="Use PIN instead"
            onPress={() => setView({ screen: "pin_verify" })}
            className="mt-6"
          />
        )}
      </View>
    );
  }

  // PIN verify screen
  return (
    <View className="flex-1 px-5 pb-5 pt-safe bg-surface-bg">
      {/* Sloth locked eyebrow */}
      <Text className="mb-2 mt-15 text-center font-mono text-[12.5px] uppercase tracking-[2px] text-brass">
        Sloth locked
      </Text>

      {/* Title */}
      <Text className="mb-8 mt-2.5 text-center font-fraunces-medium text-[22px] text-text-primary">
        {mode === "set" ? "Create a 6-digit PIN" : "Enter your PIN"}
      </Text>

      {/* PIN dots */}
      <PinDots length={PIN_LENGTH} filledCount={pinInput.length} />

      {/* Spacer pushes keypad to bottom */}
      <View className="flex-1" />

      {/* Keypad */}
      <Keypad
        key={shakeKey}
        onDigit={handleDigit}
        onBackspace={handleBackspace}
      />

      {/* Biometric fallback link */}
      {mode === "lock" && bioUsable && (
        <TextLink
          label="Use Biometric instead"
          onPress={handleBiometricFallback}
          className="mt-5"
        />
      )}
    </View>
  );
}
