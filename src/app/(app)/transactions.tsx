import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useTransactionsData } from "@/hooks/useTransactionsData";
import type { TransactionLedgerItem } from "@/lib/db/repositories/transactions";
import { formatRelativeDate, formatSignedCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";

// ─── transaction row ──────────────────────────────────────────────────────────

function TransactionLedgerRow({
  transaction,
}: {
  transaction: TransactionLedgerItem;
}) {
  const colors = useColors();
  const isIncome =
    transaction.categoryKind === "income" || transaction.amountCents > 0;

  return (
    <View
      className="flex-row items-center gap-3 border-b  py-[11px]"
      style={{
        borderColor: colors.hairline,
      }}
    >
      {/* ── Category icon badge ── */}
      <View
        className="h-9 w-9 flex-shrink-0 items-center justify-center rounded-full "
        style={{
          backgroundColor: transaction.categoryIcon
            ? colors.surfaceElevated
            : colors.surfaceCard,
        }}
      >
        <Text style={{ fontSize: 18 }}>{transaction.categoryIcon ?? "·"}</Text>
      </View>

      {/* ── Details ── */}
      <View className="flex-1 pr-2">
        <Text
          className="text-[14.5px] font-manrope-semibold "
          numberOfLines={1}
          style={{ color: colors.textPrimary }}
        >
          {transaction.merchant}
        </Text>
        <Text
          className="mt-0.5 text-[12px] "
          numberOfLines={1}
          style={{ color: colors.textSecondary }}
        >
          {transaction.categoryName ?? "Uncategorized"} ·{" "}
          {formatRelativeDate(transaction.occurredAt)}
          {transaction.source !== "manual" && (
            <Text style={{ color: colors.textSecondary }}>
              {" "}
              · {transaction.source}
            </Text>
          )}
        </Text>
      </View>

      {/* ── Amount ── */}
      <Text
        className="font-mono text-[14.5px]"
        style={{
          color: isIncome ? colors.sage : colors.textPrimary,
        }}
      >
        {formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { state, refresh } = useTransactionsData();
  const colors = useColors();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (state.status === "error") {
    return (
      <View
        className="flex-1 items-center justify-center px-8 pt-safe"
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text className="text-center text-sm" style={{ color: colors.rust }}>
          {state.message}
        </Text>
      </View>
    );
  }

  const transactions = state.status === "ready" ? state.transactions : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading = state.status === "loading";

  return (
    <View
      className="flex-1 pt-safe "
      style={{ backgroundColor: colors.surfaceBg }}
    >
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
          <Text
            className="font-fraunces-medium text-[22px] "
            style={{ color: colors.textPrimary }}
          >
            Transactions
          </Text>
          <Pressable
            onPress={() => router.push("/transaction/new")}
            className="active:opacity-60"
          >
            <Text
              className="font-manrope-bold text-[14.5px] "
              style={{ color: colors.brass }}
            >
              + Add
            </Text>
          </Pressable>
        </View>

        {/* ── Loading ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text
              className="text-sm "
              style={{
                color: colors.textSecondary,
              }}
            >
              Loading transactions…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && transactions.length === 0 && (
          <View
            className="items-center rounded-2xl border px-6 py-10"
            style={{
              backgroundColor: colors.surfaceCard,
              borderColor: colors.hairline,
            }}
          >
            <Text
              className="mb-2 font-fraunces-medium text-xl"
              style={{
                color: colors.textPrimary,
              }}
            >
              No transactions yet
            </Text>
            <Text
              className="mb-6 text-center text-sm leading-[1.55]"
              style={{
                color: colors.textSecondary,
              }}
            >
              Tap Add to record your first transaction, scan a receipt, or
              import from a CSV file.
            </Text>
            <Pressable
              onPress={() => router.push("/transaction/new")}
              className="rounded-2xl  px-6 py-3.5 active:opacity-80"
              style={{
                backgroundColor: colors.brass,
              }}
            >
              <Text
                className="font-manrope-bold text-sm"
                style={{ color: colors.ink }}
              >
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
          <Text
            className="mt-5 text-center font-mono text-[11px] "
            style={{
              color: colors.textSecondary,
            }}
          >
            {transactions.length} transaction
            {transactions.length !== 1 ? "s" : ""} · all stored on this device
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
