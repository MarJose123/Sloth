import { useState, useCallback } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { PinDots } from "@/components/ui/PinDots";
import { Keypad } from "@/components/Keypad";
import { hashPin } from "@/lib/pin";
import { storage } from "@/lib/storage";
import { useColors } from "@/theme/ThemeContext";
import { toast } from "@/hooks/useToast";
import { Lucide } from "@react-native-vector-icons/lucide";

const PIN_LENGTH = 6;

type Stage = "enter" | "confirm";

export default function BackupPinSetupScreen() {
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
      router.back();
    },
    [currentInput, stage, firstPin],
  );

  const handleBackspace = useCallback(() => {
    setCurrentInput((prev) => prev.slice(0, -1));
  }, []);

  return (
    <View
      className="flex-1 px-5 pb-5 pt-safe"
      style={{ backgroundColor: colors.surfaceBg }}
    >
      {/* ── header with back arrow ── */}
      <View className="mb-[22px] mt-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Lucide name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text
          className="font-fraunces-medium text-[22px]"
          style={{ color: colors.textPrimary }}
        >
          {stage === "enter" ? "Set backup PIN" : "Confirm your PIN"}
        </Text>
      </View>

      <Text
        className="mb-7 mt-12 text-center font-fraunces-medium text-[24px]"
        style={{ color: colors.textPrimary }}
      >
        {stage === "enter"
          ? "Create a 6-digit backup PIN"
          : "Re-enter the PIN to confirm"}
      </Text>

      <PinDots length={PIN_LENGTH} filledCount={currentInput.length} />

      <View className="flex-1" />

      <Keypad onDigit={handleDigit} onBackspace={handleBackspace} />
    </View>
  );
}
