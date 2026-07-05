import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddScreen() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-ink px-5 pt-6"
    >
      <Text className="font-serif text-2xl text-parchment">Add to Sloth</Text>
      <Text className="mt-1 text-sm text-parchment-dim">
        Screen 12 quick-add sheet goes here — wire next.
      </Text>
      <View className="flex-1" />
    </SafeAreaView>
  );
}
