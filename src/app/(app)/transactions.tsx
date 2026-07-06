import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionsScreen() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-ink px-5 pt-6"
    >
      <Text className="font-fraunces-medium text-2xl text-parchment">
        Transactions
      </Text>
      <Text className="mt-1 text-sm text-parchment-dim">
        Full ledger view goes here — wire next.
      </Text>
      <View className="flex-1" />
    </SafeAreaView>
  );
}
