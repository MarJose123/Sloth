import type { Ref } from "react";
import { Pressable, Text, View } from "react-native";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { colors } from "@/theme/colors";
import type { TabIconProps } from "./icons";

type IconComponent = (props: TabIconProps) => React.ReactElement;

type TabBarButtonProps = TabTriggerSlotProps & {
  label: string;
  Icon: IconComponent;
  ref?: Ref<View>;
};

/** Standard bottom-tab button: icon + label, brass when active. */
export function TabBarButton({
  label,
  Icon,
  isFocused,
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
      className="flex-1 items-center gap-1"
    >
      <View className="h-[22px] w-[22px] items-center justify-center">
        <Icon size={18} color={color} />
      </View>
      <Text style={{ color }} className="text-[9.5px] font-manrope-semibold">
        {label}
      </Text>
    </Pressable>
  );
}
