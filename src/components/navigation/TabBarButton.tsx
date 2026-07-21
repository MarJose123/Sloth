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

import { Pressable, View, type PressableProps } from "react-native";
import { useColors } from "@/theme/ThemeContext";
import type { TabIconProps } from "@/types";

interface TabBarButtonProps extends PressableProps {
  Icon: React.ComponentType<TabIconProps>;
  isFocused?: boolean;
}

export function TabBarButton({ Icon, isFocused, ...props }: TabBarButtonProps) {
  const colors = useColors();
  const color = isFocused ? colors.brass : colors.textSecondary;

  return (
    <Pressable
      {...props}
      className="flex-1 items-center justify-center active:opacity-70"
    >
      <View className="items-center justify-center w-8 h-8">
        <Icon size={24} color={color} />
      </View>
    </Pressable>
  );
}
