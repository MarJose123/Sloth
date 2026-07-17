import { Pressable, View, type PressableProps, useColorScheme } from "react-native";
import type { SvgProps } from "react-native-svg";
import { useColors } from "@/theme/ThemeContext";
import { lightColors } from "@/theme/lightColors";
import { darkColors } from "@/theme/darkColors";

interface TabBarButtonProps extends PressableProps {
  Icon: React.ComponentType<SvgProps>;
  isFocused?: boolean;
}

export function TabBarButton({ Icon, isFocused, ...props }: TabBarButtonProps) {
  const colors = useColorScheme() === "light" ? lightColors : darkColors;
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
