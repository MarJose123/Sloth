import { Pressable, View, type PressableProps } from "react-native";
import { useColors } from "@/theme/ThemeContext";
import type { TabIconProps } from "./icons";

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
