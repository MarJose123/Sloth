import { Pressable, View, type PressableProps } from "react-native";
import { useColors } from "@/theme/ThemeContext";
import { PlusIcon } from "@/components/navigation/icons";

/**
 * Tab-bar FAB button. Renders a brass circle with a + icon.
 * Colours react to the active theme via useColors().
 */
export function AddTabButton(props: PressableProps) {
  const colors = useColors();

  return (
    <Pressable
      {...props}
      className="active:opacity-80"
      style={[
        {
          width: 48,
          height: 48,
          borderRadius: 999, // Use a large value for full rounding
          backgroundColor: colors.brass,
          marginTop: -24,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.brass,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
          elevation: 10,
        },
        props.style as any,
      ]}
    >
      <View>
        <PlusIcon size={26} color={colors.parchment} />
      </View>
    </Pressable>
  );
}
