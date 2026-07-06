import { Pressable, Text, View } from "react-native";

export function EmptyAccountsCard({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  return (
    <View className="mt-6 items-center rounded-2xl border border-dashed border-white/20 px-6 py-10">
      <Text className="mb-2 text-center font-fraunces-medium text-xl text-parchment">
        No accounts yet
      </Text>
      <Text className="mb-6 text-center text-[13px] leading-[19px] text-parchment-dim">
        Add a checking, savings, credit, or cash account to start tracking your
        balance and spending — everything stays on this device.
      </Text>
      <Pressable
        onPress={onAddAccount}
        className="rounded-2xl bg-brass px-5 py-3.5 active:opacity-80"
      >
        <Text className="font-manrope-bold text-[14px] text-ink">
          + Add your first account
        </Text>
      </Pressable>
    </View>
  );
}
