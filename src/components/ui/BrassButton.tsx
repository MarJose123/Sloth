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

import { Pressable, Text } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface BrassButtonProps {
  label: string;
  onPress?: () => void;
}

export function BrassButton({ label, onPress }: BrassButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-[14px] p-4 active:opacity-80"
      style={{ backgroundColor: colors.brassButton }}
    >
      <Text
        className="font-manrope-bold text-[15px]"
        style={{ color: colors.buttonLabel }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
