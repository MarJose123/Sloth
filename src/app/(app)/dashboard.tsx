import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, useColorScheme, View } from "react-native";
import { router } from "expo-router";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { CategoryRingCard } from "@/components/dashboard/CategoryRingCard";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { EmptyAccountsCard } from "@/components/dashboard/EmptyAccountsCard";
import { formatCurrency, getGreeting } from "@/lib/format";
import { lightColors } from "@/theme/lightColors";
import { darkColors } from "@/theme/colors";

export default function DashboardScreen() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const { state, refresh } = useDashboardData(selectedAccountId);
  const colors = useColorScheme() === "light" ? lightColors : darkColors;

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (state.status !== "ready") return null;

  const { accounts, categories, totalExpenseCents, recentTransactions } =
    state.data;

  const hasAccounts = accounts.length > 0;
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;
  const totalBalanceCents = selectedAccount
    ? selectedAccount.balanceCents
    : accounts.reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={state.isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
          />
        }
      >
        <Text className="mb-0.5 text-[17px] tex-text-primary">
          {getGreeting()}
        </Text>

        <View className="mb-[22px] flex-row items-center gap-1.5 self-start rounded-full border border-sage/35 px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-sage" />
          <Text className="font-mono text-[11px] tracking-[0.6px] text-sage uppercase">
            Local Processing
          </Text>
        </View>

        {hasAccounts ? (
          <>
            <View className="h-5" />

            <AccountSwitcher
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelect={setSelectedAccountId}
            />

            <Text className="mb-1.5 text-[13px] text-text-secondary">
              {selectedAccount
                ? `${selectedAccount.name} balance`
                : "Total balance"}
            </Text>
            <Text className="mb-[26px] font-fraunces-medium text-[48px] leading-[52px] text-text-primary">
              {formatCurrency(totalBalanceCents)}
            </Text>

            {categories.length > 0 && (
              <View className="mb-[26px] flex-row gap-3.5">
                {categories.map((category) => (
                  <CategoryRingCard
                    key={category.id}
                    category={category}
                    totalExpenseCents={totalExpenseCents}
                  />
                ))}
              </View>
            )}

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-mono text-xs uppercase tracking-[1px] text-text-secondary">
                Recent
              </Text>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))
            ) : (
              <Text className="py-4 text-center text-sm text-text-secondary">
                No transactions yet — tap Add to record your first one.
              </Text>
            )}
          </>
        ) : (
          <EmptyAccountsCard onAddAccount={() => router.push("/add-account")} />
        )}
      </ScrollView>
    </View>
  );
}
