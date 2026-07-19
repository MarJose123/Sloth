import { useCallback } from "react";
import { Text, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useAccountsData } from "@/hooks/useAccountsData";
import type { AccountWithBalance } from "@/lib/db/repositories/accounts";
import { useColors } from "@/theme/ThemeContext";
import Color from "color";

export default function SelectAccountSheet() {
  const colors = useColors();
  const { state } = useAccountsData();
  const accounts: AccountWithBalance[] =
    state.status === "ready" ? state.accounts : [];
  const status = state.status;
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const handleSelect = useCallback(
    (accountId: string) => {
      router.replace({
        pathname: returnTo ?? "/add-transaction",
        params: { selectedAccountId: accountId },
      });
    },
    [returnTo],
  );

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  return (
    <View
      className="flex-1 justify-end"
      style={{ backgroundColor: "rgba(8,9,13,0.6)" }}
    >
      <Pressable
        onPress={handleDismiss}
        className="flex-1"
        accessibilityLabel="Close"
        accessibilityRole="button"
      />
      <View
        className="rounded-t-[22px] border-t px-5 pb-8 pt-2"
        style={{
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.hairline,
        }}
      >
        <View className="mb-5 items-center">
          <View
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: colors.hairline }}
          />
        </View>
        <Text
          className="mb-6 text-center font-fraunces-medium text-lg"
          style={{ color: colors.textPrimary }}
        >
          Select Account
        </Text>
        {status === "loading" && (
          <Text className="text-center text-text-secondary text-sm font-manrope">
            Loading…
          </Text>
        )}
        {accounts?.map((account) => (
          <Pressable
            key={account.id}
            onPress={() => handleSelect(account.id)}
            className="mb-2.5 flex-row items-center gap-4 rounded-2xl border px-4 py-3.5 active:opacity-70"
            style={{
              borderColor: colors.hairline,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: account.colorHex }}
            >
              <Text
                className="font-mono-medium text-xs"
                style={{ color: colors.ink }}
              >
                {account.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="font-manrope-bold text-[13px]"
                style={{ color: colors.textPrimary }}
              >
                {account.name}
              </Text>
              <Text
                className="text-[11.5px] leading-4"
                style={{ color: colors.textSecondary }}
              >
                {account.type}
              </Text>
            </View>
            <Lucide name="chevron-right" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
        {accounts?.length === 0 && status !== "loading" && (
          <Text className="text-center text-text-secondary text-sm font-manrope py-8">
            No accounts yet. Create one first.
          </Text>
        )}
      </View>
    </View>
  );
}
