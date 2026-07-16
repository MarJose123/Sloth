import { useState, useCallback } from "react";
import { Text, Alert, View } from "react-native";
import { router } from "expo-router";
import { PinDots } from "@/components/ui/PinDots";
import { Keypad } from "@/components/Keypad";
import { hashPin, isValidPinFormat } from "@/lib/pin";
import { storage } from "@/lib/storage";

const PIN_LENGTH = 6;

type Stage = "enter" | "confirm";

export default function PinSetupScreen() {
  const colors = useColors();
  const [stage, setStage] = useState<Stage>("enter");
  const [firstPin, setFirstPin] = useState("");
  const [currentInput, setCurrentInput] = useState("");

  const handleDigit = useCallback(
    async (digit: string) => {
      if (currentInput.length >= PIN_LENGTH) return;
      const next = currentInput + digit;
      setCurrentInput(next);

      if (next.length !== PIN_LENGTH) return;

      if (stage === "enter") {
        if (!isValidPinFormat(next)) {
          Alert.alert("Invalid PIN", "PIN must be 6 digits.");
          setCurrentInput("");
          return;
        }
        setFirstPin(next);
        setStage("confirm");
        setCurrentInput("");
        return;
      }

      // stage === 'confirm'
      if (next !== firstPin) {
        Alert.alert("PINs didn't match", "Try setting your PIN again.");
        setStage("enter");
        setFirstPin("");
        setCurrentInput("");
        return;
      }

      const hash = await hashPin(next);
      await storage.setPinHash(hash);
      await storage.setOnboardingComplete(true);
      router.replace("/(app)/dashboard");
    },
    [currentInput, stage, firstPin],
  );

  const handleBackspace = useCallback(() => {
    setCurrentInput((prev) => prev.slice(0, -1));
  }, []);

  return (
    <View
      className="flex-1 px-5 pb-5 pt-safe"
      style={{ backgroundColor: colors.ink }}
    >
      <Text className="mt-15 text-center font-mono text-[12.5px] uppercase tracking-[2px] text-parchment-dim">
        Sloth setup
      </Text>
      <Text className="mb-7 mt-2.5 text-center font-fraunces-medium text-[22px] text-parchment">
        {stage === "enter" ? "Create a 6-digit PIN" : "Confirm your PIN"}
      </Text>

      <PinDots length={PIN_LENGTH} filledCount={currentInput.length} />

      <View className="flex-1" />

      <Keypad onDigit={handleDigit} onBackspace={handleBackspace} />
    </View>
  );
}
