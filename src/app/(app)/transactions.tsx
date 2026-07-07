import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTransactionsData } from "@/hooks/useTransactionsData";
import type { TransactionLedgerItem } from "@/lib/db/repositories/transactions";
import { formatRelativeDate, formatSignedCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

// ─── transaction row ──────────────────────────────────────────────────────────

function TransactionLedgerRow({
  transaction,
}: {
  transaction: TransactionLedgerItem;
}) {
  const isIncome =
    transaction.categoryKind === "income" || transaction.amountCents > 0;

  const amountColor = isIncome ? colors.sage : colors.parchment;

  return (
    <View className="flex-row items-center gap-3 border-b border-white/[0.09] py-[11px]">
      {/* ── Category icon badge ── */}
      <View
        className="h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: transaction.categoryIcon
            ? "rgba(243,238,225,0.07)"
            : "rgba(243,238,225,0.05)",
        }}
      >
        <Text style={{ fontSize: 16 }}>{transaction.categoryIcon ?? "·"}</Text>
      </View>

      {/* ── Details ── */}
      <View className="flex-1 pr-2">
        <Text
          className="text-[13.5px] font-manrope-semibold text-parchment"
          numberOfLines={1}
        >
          {transaction.merchant}
        </Text>
        <Text
          className="mt-0.5 text-[11px] text-parchment-dim"
          numberOfLines={1}
        >
          {transaction.categoryName ?? "Uncategorized"} ·{" "}
          {formatRelativeDate(transaction.occurredAt)}
          {transaction.source !== "manual" && (
            <Text className="text-parchment-dim"> · {transaction.source}</Text>
          )}
        </Text>
      </View>

      {/* ── Amount ── */}
      <Text className="font-mono text-[13.5px]" style={{ color: amountColor }}>
        {formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { state, refresh } = useTransactionsData();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

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

  const transactions = state.status === "ready" ? state.transactions : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading = state.status === "loading";

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink">
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
          <Text className="font-fraunces-medium text-[20px] text-parchment">
            Transactions
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

        {/* ── Loading ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text className="text-sm text-parchment-dim">
              Loading transactions…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && transactions.length === 0 && (
          <View className="items-center rounded-2xl border border-white/[0.09] bg-ink-2 px-6 py-10">
            <Text className="mb-2 font-fraunces-medium text-xl text-parchment">
              No transactions yet
            </Text>
            <Text className="mb-6 text-center text-sm leading-[1.55] text-parchment-dim">
              Tap Add to record your first transaction, scan a receipt, or
              import from a CSV file.
            </Text>
            <Pressable
              onPress={() => router.push("/(app)/add")}
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
          <Text className="mt-5 text-center font-mono text-[10px] text-parchment-dim">
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} · all stored on this device
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
