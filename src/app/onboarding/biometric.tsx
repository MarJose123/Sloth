import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import { DialFrame } from "@/components/DialFrame";
import { FingerprintIcon } from "@/components/ui/FingerprintIcon";
import { BrassButton } from "@/components/ui/BrassButton";
import { TextLink } from "@/components/ui/TextLink";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "@/lib/biometrics";
import { storage } from "@/lib/storage";

export default function BiometricSetupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function handleEnableBiometrics() {
    setIsAuthenticating(true);
    try {
      const availability = await checkBiometricAvailability();

      if (!availability.available) {
        const message =
          availability.reason === "no_hardware"
            ? "This device doesn't support Face ID or Touch ID. Use a PIN instead."
            : "No biometrics are enrolled on this device. Set one up in system settings, or use a PIN instead.";
        Alert.alert("Biometrics unavailable", message);
        return;
      }

      const success = await authenticateWithBiometrics(
        "Confirm to enable Sloth lock",
      );
      if (!success) return;

      await storage.setBiometricEnabled(true);
      await storage.setOnboardingComplete(true);
      router.replace("/(app)/dashboard");
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <View className="flex-1 bg-ink px-5 pt-safe">
      {/* ── Header text ── */}
      <Text className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-parchment-dim">
        Step 3 of 3
      </Text>

      {/* ── Content ── */}
      <View className="flex-1">
        <Text className="mb-2 mt-[10px] font-fraunces-medium text-[26px] leading-[32px] text-parchment">
          Lock Sloth to your face or fingerprint.
        </Text>
        <Text className="mb-8 text-[13.5px] leading-[20px] text-parchment-dim">
          This unlocks the app only — it&apos;s separate from your device
          passcode and never leaves your phone.
        </Text>

        <DialFrame size={150} innerSize={78} variant="brass">
          <FingerprintIcon size={30} />
        </DialFrame>

        {/* Caption anchored to bottom of flex-1 via mb-auto */}
        <Text
          style={{ marginTop: 16, marginBottom: "auto" }}
          className="text-center font-mono text-xs uppercase tracking-[0.05em] text-brass"
        >
          Touch the sensor to continue
        </Text>
      </View>

      {/* ── Buttons ── */}
      <View className="gap-2.5 pb-7">
        <BrassButton
          label={isAuthenticating ? "Waiting…" : "Enable Face / Touch ID"}
          onPress={handleEnableBiometrics}
        />
        <TextLink
          label="Use a 6-digit PIN instead"
          onPress={() => router.push("/onboarding/pin-setup")}
        />
      </View>
    </View>
  );
}
