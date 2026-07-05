import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView className="flex-1 bg-ink px-5 pb-7 pt-3">
      <View className="flex-1">
        <Text className="font-mono text-[11px] uppercase tracking-[2px] text-parchment-dim">
          Step 3 of 3
        </Text>

        <Text className="mb-2 mt-2.5 font-serif text-[26px] leading-[32px] text-parchment">
          Lock Sloth to your face or fingerprint.
        </Text>
        <Text className="mb-8 text-[13.5px] leading-[20px] text-parchment-dim">
          This unlocks the app only — it&apos;s separate from your device
          passcode and never leaves your phone.
        </Text>

        <DialFrame size={150} innerSize={78}>
          <FingerprintIcon size={30} />
        </DialFrame>

        <Text className="mb-auto mt-3.5 text-center font-mono text-xs uppercase tracking-[1px] text-brass">
          Touch the sensor to continue
        </Text>
      </View>

      <View className="gap-2.5">
        <BrassButton
          label={isAuthenticating ? "Waiting…" : "Enable Face / Touch ID"}
          onPress={handleEnableBiometrics}
        />
        <TextLink
          label="Use a 6-digit PIN instead"
          onPress={() => router.push("/onboarding/pin-setup")}
        />
      </View>
    </SafeAreaView>
  );
}
