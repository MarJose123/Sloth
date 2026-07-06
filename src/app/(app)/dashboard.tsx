import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { CategoryRingCard } from "@/components/dashboard/CategoryRingCard";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { EmptyAccountsCard } from "@/components/dashboard/EmptyAccountsCard";
import { formatCurrency, getGreeting } from "@/lib/format";

export default function DashboardScreen() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const { state, refresh } = useDashboardData(selectedAccountId);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (state.status === "loading") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center bg-ink"
      >
        <Text className="text-sm text-parchment-dim">
          Loading your accounts…
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === "error") {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center bg-ink px-8"
      >
        <Text className="text-center text-sm text-rust">{state.message}</Text>
      </SafeAreaView>
    );
  }

  const { accounts, categories, totalExpenseCents, recentTransactions } =
    state.data;

  const hasAccounts = accounts.length > 0;
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;
  const totalBalanceCents = selectedAccount
    ? selectedAccount.balanceCents
    : accounts.reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={state.isRefreshing}
            onRefresh={onRefresh}
            tintColor="#C87B54"
          />
        }
      >
        <Text className="mb-0.5 text-[12.5px] text-parchment-dim">
          {getGreeting()}
        </Text>

        <View className="mb-[22px] flex-row items-center gap-1.5 self-start rounded-full border border-sage/35 px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-sage" />
          <Text className="font-mono text-[10px] tracking-[0.6px] text-sage uppercase">
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

            <Text className="mb-1.5 text-xs text-parchment-dim">
              {selectedAccount
                ? `${selectedAccount.name} balance`
                : "Total balance"}
            </Text>
            <Text className="mb-[26px] font-fraunces-medium text-[44px] leading-[48px] text-parchment">
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
              <Text className="font-mono text-[11px] uppercase tracking-[1px] text-parchment-dim">
                Recent
              </Text>
              <Pressable
                onPress={() => router.push("/(app)/add")}
                className="rounded-full bg-brass px-3 py-1.5 active:opacity-80"
              >
                <Text className="font-manrope-bold text-[11px] text-ink">
                  + Add
                </Text>
              </Pressable>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))
            ) : (
              <Text className="py-4 text-center text-[12.5px] text-parchment-dim">
                No transactions yet — tap Add to record your first one.
              </Text>
            )}
          </>
        ) : (
          <EmptyAccountsCard onAddAccount={() => router.push("/(app)/add")} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
