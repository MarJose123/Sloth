import { Pressable, Text, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

export function EmptyAccountsCard({
  onAddAccount,
}: {
  onAddAccount: () => void;
}) {
  const colors = useColors();
  return (
    <View
      className="mt-6 items-center rounded-2xl border px-6 py-10"
      style={{
        borderColor: colors.hairline,
        backgroundColor: colors.surfaceCard,
      }}
    >
      <Text
        className="mb-2 text-center font-fraunces-medium text-[22px]"
        style={{
          color: colors.textPrimary,
        }}
      >
        No accounts yet
      </Text>
      <Text
        className="mb-6 text-center text-[14.5px] leading-5.25 "
        style={{ color: colors.textSecondary }}
      >
        Add a checking, savings, credit, or cash account to start tracking your
        balance and spending — everything stays on this device.
      </Text>
      <Pressable
        onPress={onAddAccount}
        className="rounded-2xl px-5 py-3.5 active:opacity-80"
        style={{ backgroundColor: colors.brass }}
      >
        <Text
          className="font-manrope-bold text-[15px]"
          style={{ color: colors.ink }}
        >
          + Add your first account
        </Text>
      </Pressable>
    </View>
  );
}
