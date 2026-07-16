import type { Ref } from "react";
import { Pressable, View } from "react-native";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { colors } from "@/theme/colors";
import { PlusIcon } from "./icons";
import { Text } from "react-native";

type AddTabButtonProps = TabTriggerSlotProps & { ref?: Ref<View> };

/** The raised brass "+" button in the middle of the tab bar — opens the quick-add sheet. */
export function AddTabButton({ isFocused, ref, ...props }: AddTabButtonProps) {
  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="button"
      accessibilityLabel="Add"
      accessibilityState={{ selected: isFocused }}
      className="flex-1 items-center justify-center"
    >
      <View
        className="w-[48px] h-[48px] rounded-full bg-brass items-center justify-center -mt-6"
        style={{
          elevation: 10,
          shadowColor: "#C87B54",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        }}
      >
        <PlusIcon size={26} color={colors.ink} />
      </View>
    </Pressable>
  );
}
