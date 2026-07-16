import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";
import { colors } from "@/theme/colors";
import type { TabIconProps } from "./icons";

type IconComponent = (props: TabIconProps) => React.ReactElement;

type TabBarButtonProps = PressableProps & {
  label: string;
  Icon: IconComponent;
  isFocused?: boolean;
  ref?: Ref<View>;
};

/** Standard bottom-tab button: icon + label, brass when active. */
export function TabBarButton({
  label,
  Icon,
  isFocused = false,
  ref,
  ...props
}: TabBarButtonProps) {
  const color = isFocused ? colors.brass : colors.parchmentDim;

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      className="flex-1 items-center justify-center"
    >
      <View className="w-[32px] h-[32px] items-center justify-center">
        <Icon size={24} color={color} />
      </View>
    </Pressable>
  );
}
