import {
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { useColors } from "@/theme/ThemeContext";
import { PlusIcon } from "@/components/navigation/icons";

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
        className="active:opacity-80 bg-brass"
        style={[
          {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginTop: -24,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            shadowColor: colors.brass,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 10,
          },
          props.style as StyleProp<ViewStyle>,
        ]}
      >
        <PlusIcon size={26} color={colors.parchment} />
      </Pressable>
    </View>
  );
}
