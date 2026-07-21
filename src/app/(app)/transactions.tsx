import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useTransactionsData } from "@/hooks/useTransactionsData";
import { useAccountsData } from "@/hooks/useAccountsData";
import { deleteTransaction } from "@/lib/db/repositories/transactions";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import type { MonthRange, TransactionLedgerItem } from "@/types";
import {
  formatMonthLabel,
  formatRelativeDate,
  formatSignedCurrency,
} from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Builds a MonthRange for the month containing `date`. */
function monthRange(date: Date): MonthRange {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1,
  ).getTime();
  return { start, end };
}

/** Moves a Date forward or backward by `delta` months. */
function shiftMonth(reference: Date, delta: number): Date {
  const d = new Date(reference);
  d.setMonth(d.getMonth() + delta);
  return d;
}

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
          {transaction.accountName} ·{" "}
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

/** True when two epoch-ms timestamps fall on the same calendar day (local tz). */
function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/** Width reserved for the swipe-revealed action area. */
const DELETE_ACTION_WIDTH = 60;

// ─── swipeable transaction row ───────────────────────────────────────────────

function SwipeableTransactionRow({
  transaction,
  onDelete,
}: {
  transaction: TransactionLedgerItem;
  onDelete: () => void;
}) {
  const colors = useColors();
  const swipeableRef = useRef<any>(null);

  // Only allow deletion if the transaction was created today
  const deletable = isSameDay(transaction.createdAt, Date.now());

  const iconOpacity = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  const handleDelete = useCallback(() => {
    // Fade the icon out in 5ms before the Alert appears
    iconOpacity.value = withTiming(0, { duration: 4 });
    Alert.alert(
      "Delete transaction",
      `Remove "${transaction.merchant}" (${formatSignedCurrency(transaction.amountCents)})? This cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            iconOpacity.value = withTiming(1, { duration: 4 });
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ],
    );
  }, [transaction, onDelete]);

  // Render the trash icon — the Swipeable handles the slide-in/slide-out
  // animation natively, with a 4ms opacity fade on the icon.
  const renderRightActions = useCallback(
    () => (
      <View
        className="ml-2 h-full items-center justify-center"
        style={{ width: DELETE_ACTION_WIDTH }}
      >
        <Animated.View style={iconStyle}>
          <Lucide name="trash-2" size={20} color={colors.rust} />
        </Animated.View>
      </View>
    ),
    [colors.rust, iconStyle],
  );

  // Close the swipeable and show confirmation immediately when the user
  // swipes far enough — prevents the action area from ever fully opening
  // and avoids layout overlap when the Alert dialog appears.
  const onSwipeableWillOpen = useCallback(
    (direction: string) => {
      if (direction === "left") {
        swipeableRef.current?.close();
        handleDelete();
      }
    },
    [handleDelete],
  );

  // When not deletable (older than today), render the plain row
  if (!deletable) {
    return <TransactionLedgerRow transaction={transaction} />;
  }

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      overshootRight={false}
      rightThreshold={40}
    >
      <TransactionLedgerRow transaction={transaction} />
    </ReanimatedSwipeable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedRange, setSelectedRange] = useState<MonthRange | null>(
    monthRange(new Date()),
  );

  const anchorDate = selectedRange
    ? new Date(selectedRange.start)
    : new Date();

  const { state, refresh } = useTransactionsData(
    selectedAccountId ?? undefined,
    selectedRange ?? undefined,
  );
  const { state: accountsState } = useAccountsData();
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
            onPress={() => router.push("/add-transaction")}
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

        {/* ── Account filter ── */}
        {accountsState.status === "ready" && (
          <AccountSwitcher
            accounts={accountsState.accounts}
            selectedAccountId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />
        )}

        {/* ── Date range filter ── */}
        <View className="mb-4 mt-0.5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-0.5">
            <Pressable
              onPress={() =>
                setSelectedRange(monthRange(shiftMonth(anchorDate, -1)))
              }
              className="h-8 w-8 items-center justify-center rounded-full active:opacity-60"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Text
                className="text-base leading-none "
                style={{ color: colors.textSecondary }}
              >
                {"\u2039"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedRange(monthRange(new Date()))}
              className="active:opacity-60"
            >
              <Text
                className="min-w-[100px] text-center font-fraunces-medium text-[16px] "
                style={{ color: colors.textPrimary }}
              >
                {selectedRange ? formatMonthLabel(anchorDate) : "All time"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setSelectedRange(monthRange(shiftMonth(anchorDate, 1)))
              }
              className="h-8 w-8 items-center justify-center rounded-full active:opacity-60"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Text
                className="text-base leading-none "
                style={{ color: colors.textSecondary }}
              >
                {"\u203A"}
              </Text>
            </Pressable>
          </View>

          {selectedRange ? (
            <Pressable
              onPress={() => setSelectedRange(null)}
              className="rounded-full px-3 py-1 active:opacity-60"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Text
                className="font-mono text-[11px] "
                style={{ color: colors.textSecondary }}
              >
                All time
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setSelectedRange(monthRange(new Date()))}
              className="rounded-full px-3 py-1 active:opacity-60"
              style={{ backgroundColor: colors.surfaceElevated }}
            >
              <Text
                className="font-mono text-[11px] "
                style={{ color: colors.brass }}
              >
                This month
              </Text>
            </Pressable>
          )}
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
              onPress={() => router.push("/add-transaction")}
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
            <SwipeableTransactionRow
              key={tx.id}
              transaction={tx}
              onDelete={async () => {
                await deleteTransaction(tx.id);
                refresh();
              }}
            />
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
