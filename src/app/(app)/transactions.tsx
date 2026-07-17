import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTransactionsData } from "@/hooks/useTransactionsData";
import type { TransactionLedgerItem } from "@/lib/db/repositories/transactions";
import { formatRelativeDate, formatSignedCurrency } from "@/lib/format";
import { lightColors } from "@/theme/lightColors";
import { darkColors } from "@/theme/darkColors";

// ─── transaction row ──────────────────────────────────────────────────────────

function TransactionLedgerRow({
  transaction,
}: {
  transaction: TransactionLedgerItem;
}) {
  const isIncome =
    transaction.categoryKind === "income" || transaction.amountCents > 0;

  const amountClassName = isIncome ? "text-sage" : "text-text-primary";
  const badgeClassName = transaction.categoryIcon
    ? "bg-surface-elevated"
    : "bg-surface-card";

  return (
    <View className="flex-row items-center gap-3 border-b border-hairline py-[11px]">
      {/* ── Category icon badge ── */}
      <View
        className={`h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${badgeClassName}`}
      >
        <Text style={{ fontSize: 18 }}>{transaction.categoryIcon ?? "·"}</Text>
      </View>

      {/* ── Details ── */}
      <View className="flex-1 pr-2">
        <Text
          className="text-[14.5px] font-manrope-semibold text-text-primary"
          numberOfLines={1}
        >
          {transaction.merchant}
        </Text>
        <Text
          className="mt-0.5 text-[12px] text-text-secondary"
          numberOfLines={1}
        >
          {transaction.categoryName ?? "Uncategorized"} ·{" "}
          {formatRelativeDate(transaction.occurredAt)}
          {transaction.source !== "manual" && (
            <Text className="text-text-secondary"> · {transaction.source}</Text>
          )}
        </Text>
      </View>

      {/* ── Amount ── */}
      <Text className={`font-mono text-[14.5px] ${amountClassName}`}>
        {formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { state, refresh } = useTransactionsData();
  const colors = useColorScheme() === "light" ? lightColors : darkColors;

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (state.status === "error") {
    return (
      <View className="flex-1 items-center justify-center px-8 pt-safe bg-surface-bg">
        <Text className="text-center text-sm text-rust">{state.message}</Text>
      </View>
    );
  }

  const transactions = state.status === "ready" ? state.transactions : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading = state.status === "loading";

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
          />
        }
      >
        {/* ── Header ── */}
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="font-fraunces-medium text-[22px] text-text-primary">
            Transactions
          </Text>
          <Pressable
            onPress={() => router.push("/transaction/new")}
            className="rounded-full bg-brass px-3 py-1.5 active:opacity-80"
          >
            <Text className="font-manrope-bold text-[12px] text-ink">
              + Add
            </Text>
          </Pressable>
        </View>

        {/* ── Loading ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text className="text-sm text-text-secondary">
              Loading transactions…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && transactions.length === 0 && (
          <View className="items-center rounded-2xl border border-hairline bg-surface-card px-6 py-10">
            <Text className="mb-2 font-fraunces-medium text-xl text-text-primary">
              No transactions yet
            </Text>
            <Text className="mb-6 text-center text-sm leading-[1.55] text-text-secondary">
              Tap Add to record your first transaction, scan a receipt, or
              import from a CSV file.
            </Text>
            <Pressable
              onPress={() => router.push("/transaction/new")}
              className="rounded-2xl bg-brass px-6 py-3.5 active:opacity-80"
            >
              <Text className="font-manrope-bold text-sm text-ink">
                Add transaction
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Ledger list ── */}
        {!isLoading &&
          transactions.map((tx) => (
            <TransactionLedgerRow key={tx.id} transaction={tx} />
          ))}

        {/* ── End of list note ── */}
        {!isLoading && transactions.length > 0 && (
          <Text className="mt-5 text-center font-mono text-[11px] text-text-secondary">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} · all stored on this device
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
