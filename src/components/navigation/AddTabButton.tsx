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

import {
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { PlusIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";

/**
 * Tab-bar FAB button. Renders a brass circle with a + icon.
 * Colours react to the active theme via useColors().
 */
export function AddTabButton(props: PressableProps) {
  const colors = useColors();

  return (
    <View
      style={{
        width: 72,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Pressable
        {...props}
        className="active:opacity-80"
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginTop: -24,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: colors.brass,
            shadowColor: colors.brass,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 10,
          },
          props.style as StyleProp<ViewStyle>,
        ]}
      >
        <PlusIcon size={26} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}
