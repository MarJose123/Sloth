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

import { View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface PinDotsProps {
  length: number;
  filledCount: number;
}

export function PinDots({ length, filledCount }: PinDotsProps) {
  const colors = useColors();
  return (
    <View className="mb-10 flex-row justify-center gap-4">
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          className="h-3.5 w-3.5 rounded-full border-[1.5px]"
          style={{
            borderColor: colors.brass,
            backgroundColor: i < filledCount ? colors.brass : undefined,
          }}
        />
      ))}
    </View>
  );
}
