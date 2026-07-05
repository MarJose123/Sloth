import type { Ref } from "react";
import { Pressable, View } from "react-native";
import type { TabTriggerSlotProps } from "expo-router/ui";
import { colors } from "@/theme/colors";
import { PlusIcon } from "./icons";

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
      className="flex-1 items-center"
    >
      <View
        className="-mt-5 h-11 w-11 items-center justify-center rounded-full bg-brass"
        style={{
          shadowColor: colors.brass,
          shadowOpacity: 0.5,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          borderWidth: isFocused ? 5 : 0,
          borderColor: "rgba(200,123,84,0.15)",
        }}
      >
        <PlusIcon size={22} color={colors.ink} />
      </View>
    </Pressable>
  );
}
