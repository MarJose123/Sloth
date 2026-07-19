import { useState, useCallback } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { PinDots } from "@/components/ui/PinDots";
import { Keypad } from "@/components/Keypad";
import { hashPin, isValidPinFormat } from "@/lib/pin";
import { storage } from "@/lib/storage";
import { toast } from "@/hooks/useToast";
import { lightColors } from "@/theme/lightColors";

const PIN_LENGTH = 6;

type Stage = "enter" | "confirm";

export default function PinSetupScreen() {
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
          toast.error("Invalid PIN", {
            description: "PIN must be 6 digits.",
          });
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
        toast.error("PINs didn't match", {
          description: "Try setting your PIN again.",
        });
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
      className="flex-1 px-5 pb-5 pt-safe "
      style={{
        backgroundColor: lightColors.surfaceBg,
      }}
    >
      <Text
        className="mt-15 text-center font-mono text-[14px] uppercase tracking-[2px] "
        style={{
          color: lightColors.textSecondary,
        }}
      >
        Sloth setup
      </Text>
      <Text
        className="mb-7 mt-2.5 text-center font-fraunces-medium text-[24px]"
        style={{ color: lightColors.textPrimary }}
      >
        {stage === "enter" ? "Create a 6-digit PIN" : "Confirm your PIN"}
      </Text>

      <PinDots length={PIN_LENGTH} filledCount={currentInput.length} />

      <View className="flex-1" />

      <Keypad onDigit={handleDigit} onBackspace={handleBackspace} />
    </View>
  );
}
