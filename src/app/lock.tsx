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

import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { PinDots } from "@/components/ui/PinDots";
import { Keypad } from "@/components/Keypad";
import { DialFrame } from "@/components/DialFrame";
import { FingerprintIcon } from "@/components/ui/FingerprintIcon";
import { BrassButton } from "@/components/ui/BrassButton";
import { TextLink } from "@/components/ui/TextLink";
import { hashPin } from "@/lib/pin";
import { storage } from "@/lib/storage";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometrics";

const PIN_LENGTH = 6;

type LockMode = "lock" | "set";
type ViewState =
  { screen: "biometric" } | { screen: "pin_verify"; error?: string };

export default function LockScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: LockMode = params.mode === "set" ? "set" : "lock";

  const [view, setView] = useState<ViewState>({ screen: "biometric" });
  const [pinInput, setPinInput] = useState("");
  const [shakeKey, setShakeKey] = useState(0);

  // ── attempt biometric on mount ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function tryBiometric() {
      if (mode === "set") {
        // Setting a new PIN — show PIN entry directly
        if (!cancelled) setView({ screen: "pin_verify" });
        return;
      }

      const availability = await checkBiometricAvailability();
      if (!availability.available || !(await storage.getBiometricEnabled())) {
        if (!cancelled) setView({ screen: "pin_verify" });
        return;
      }

      const success = await authenticateWithBiometrics("Unlock Sloth");
      if (cancelled) return;

      if (success) {
        router.replace("/(app)/dashboard");
      } else {
        setView({ screen: "pin_verify" });
      }
    }

    tryBiometric();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // ── PIN digit handler ────────────────────────────────────────────────────────
  const handleDigit = useCallback(
    async (digit: string) => {
      if (pinInput.length >= PIN_LENGTH) return;
      const next = pinInput + digit;
      setPinInput(next);

      if (next.length !== PIN_LENGTH) {
        if (mode === "set") return;
        return;
      }

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
    const success = await authenticateWithBiometrics("Unlock Sloth");
    if (success) {
      router.replace("/(app)/dashboard");
    }
  }, []);

  // ── render ───────────────────────────────────────────────────────────────────

  if (view.screen === "biometric") {
    return (
      <View className="flex-1 items-center justify-center px-5 bg-surface-bg">
        {/* Brass brand-mark */}
        <View className="mb-2">
          <Text className="text-center font-mono text-[12.5px] uppercase tracking-[2px] text-brass">
            Sloth
          </Text>
        </View>

        {/* Biometric ring with fingerprint */}
        <DialFrame size={110}>
          <FingerprintIcon size={32} />
        </DialFrame>

        <Text className="mb-2 mt-8 text-center font-fraunces-medium text-[24px] text-text-primary">
          Welcome back
        </Text>
        <Text className="mb-10 text-center text-[14.5px] text-text-secondary">
          Unlock to see your accounts
        </Text>

        <BrassButton
          label="Unlock with Face ID"
          onPress={handleBiometricFallback}
        />

        <TextLink
          label="Use PIN instead"
          onPress={() => setView({ screen: "pin_verify" })}
          className="mt-6"
        />
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
      {mode === "lock" && (
        <TextLink
          label="Use Face ID instead"
          onPress={handleBiometricFallback}
          className="mt-5"
        />
      )}
    </View>
  );
}
