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

import { Pressable, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * A minimal two-state toggle that matches the Sloth design system.
 * Uses dynamic className for colour switching — no hook needed.
 * Thumb position and borderWidth remain as inline styles (layout concerns).
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
        borderWidth: value ? 0 : 1,
        borderColor: colors.hairline,
        backgroundColor: value ? colors.brassText : colors.surfaceElevated,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          alignSelf: value ? "flex-end" : "flex-start",
          backgroundColor: value ? colors.parchment : colors.textSecondary,
        }}
      />
    </Pressable>
  );
}
