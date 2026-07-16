import { Pressable, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * A minimal two-state toggle that matches the Sloth design system.
 * Uses inline styles intentionally — the thumb position is a boolean
 * switch between two discrete states, not a Tailwind utility concern.
 * Colours react to the active theme via useColors().
 */
export function Toggle({
  value,
  onValueChange,
  disabled = false,
}: ToggleProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={{
        width: 40,
        height: 24,
        borderRadius: 12,
        paddingHorizontal: 3,
        justifyContent: "center",
        backgroundColor: value ? colors.brass : colors.ink3,
        borderWidth: value ? 0 : 1,
        borderColor: "rgba(243,238,225,0.09)",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: value ? colors.parchment : colors.parchmentDim,
          alignSelf: value ? "flex-end" : "flex-start",
        }}
      />
    </Pressable>
  );
}
