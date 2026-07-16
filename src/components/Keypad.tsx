import { View, Pressable, Text, useWindowDimensions } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function Keypad({ onDigit, onBackspace }: KeypadProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  // Formula from AGENTS.md: KEY_SIZE = (screenWidth - 44 - 14*2) / 3
  // 44 seems to be horizontal padding (22*2)
  // 14*2 seems to be gaps
  const KEY_SIZE = Math.min((SCREEN_WIDTH - 44 - 14 * 2) / 3, 85);

  return (
    <View
      className="flex-row flex-wrap justify-center py-5"
      style={{ rowGap: 14, columnGap: 14 }}
    >
      {DIGITS.map((digit) => (
        <KeypadKey
          key={digit}
          label={digit}
          onPress={() => onDigit(digit)}
          size={KEY_SIZE}
        />
      ))}
      <View style={{ width: KEY_SIZE, height: KEY_SIZE }} />
      <KeypadKey label="0" onPress={() => onDigit("0")} size={KEY_SIZE} />
      <KeypadKey
        label="⌫"
        onPress={onBackspace}
        muted
        size={KEY_SIZE}
        isBackspace
      />
    </View>
  );
}

function KeypadKey({
  label,
  onPress,
  size,
  muted = false,
  isBackspace = false,
}: {
  label: string;
  onPress: () => void;
  size: number;
  muted?: boolean;
  isBackspace?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === "⌫" ? "Backspace" : `Digit ${label}`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: muted ? "transparent" : colors.ink2,
        borderWidth: muted ? 0 : 1,
        borderColor: colors.hairline,
      }}
      className="items-center justify-center active:opacity-70"
    >
      <Text
        className={isBackspace ? "text-xl" : "text-[26px]"}
        style={{ color: colors.parchment, fontFamily: "Manrope_700Bold" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
