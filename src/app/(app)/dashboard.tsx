/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useDashboardData } from "@/hooks/useDashboardData";
import { AccountSwitcher } from "@/components/dashboard/AccountSwitcher";
import { CategoryRingCard } from "@/components/dashboard/CategoryRingCard";
import { TransactionRow } from "@/components/dashboard/TransactionRow";
import { EmptyAccountsCard } from "@/components/dashboard/EmptyAccountsCard";
import { WeeklyActivityCard } from "@/components/dashboard/WeeklyActivityCard";
import {
  formatCurrency,
  formatMonthLabel,
  getGreeting,
  HIDDEN_AMOUNT,
} from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";
import { isSessionUnlocked, lockSession } from "@/lib/sessionLock";
import { useAmountsVisibility } from "@/hooks/useAmountsVisibility";
import { GlowBackdrop } from "@/components/ui/GlowBackdrop";
import Color from "color";

// ─── animated balance ──────────────────────────────────────────────────────────

/**
 * Counts from the previous balance to the new one over ~550ms (ease-out).
 * Runs on the JS thread so currency formatting stays exact.
 */
function AnimatedBalance({
  cents,
  className,
  hidden = false,
}: {
  cents: number;
  className: string;
  /** When true, renders the masked amount instead of the counted-up figure. */
  hidden?: boolean;
}) {
  const colors = useColors();
  const [displayCents, setDisplayCents] = useState(cents);
  const prevRef = useRef(cents);

  useEffect(() => {
    const from = prevRef.current;
    const to = cents;
    prevRef.current = to;
    if (from === to) return;

    const duration = 550;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplayCents(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents]);

  return (
    <Text className={className} style={{ color: colors.textPrimary }}>
      {hidden ? HIDDEN_AMOUNT : formatCurrency(displayCents)}
    </Text>
  );
}

// ─── screen ────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colors = useColors();
  const { amountsHidden, toggleAmountsHidden } = useAmountsVisibility();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const { state, refresh } = useDashboardData(selectedAccountId);

  const onRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleLock = useCallback(() => {
    if (!isSessionUnlocked()) return; // no unlock method configured
    lockSession();
    router.replace("/lock");
  }, []);

  if (state.status !== "ready") return null;

  const {
    accounts,
    categories,
    totalExpenseCents,
    totalIncomeCents,
    spentByAccount,
    earnedByAccount,
    recentTransactions,
  } = state.data;

  const hasAccounts = accounts.length > 0;
  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;
  const totalBalanceCents = selectedAccount
    ? selectedAccount.balanceCents
    : accounts
        .filter((a) => a.balanceCents > 0)
        .reduce((sum, a) => sum + a.balanceCents, 0);

  return (
    <View
      className="flex-1 pt-safe"
      style={{
        backgroundColor: colors.surfaceBg,
      }}
    >
      {/* Glow layer anchored to the full screen — unaffected by content padding */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlowBackdrop />
      </View>
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
        <Animated.View entering={FadeInDown.duration(450)}>
          <View className="mb-0.5 flex-row items-center justify-between">
            <Text className="text-[17px]" style={{ color: colors.textPrimary }}>
              {getGreeting()}
            </Text>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={toggleAmountsHidden}
                hitSlop={12}
                accessibilityLabel={
                  amountsHidden ? "Show amounts" : "Hide amounts"
                }
                accessibilityRole="button"
                className="active:opacity-60"
              >
                <Lucide
                  name={amountsHidden ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={handleLock}
                hitSlop={12}
                accessibilityLabel="Lock app"
                accessibilityRole="button"
                className="active:opacity-60"
              >
                <Lucide name="lock" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(80).duration(450)}
          className="mb-[22px]"
        >
          <View
            className="flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1"
            style={{
              borderColor: Color(colors.sage).alpha(0.35).rgb().string(),
            }}
          >
            <View
              className="h-1.5 w-1.5 rounded-full "
              style={{ backgroundColor: colors.sage }}
            />
            <Text
              className="font-mono text-[11px] tracking-[0.6px] uppercase"
              style={{ color: colors.sage }}
            >
              Local Processing
            </Text>
          </View>
        </Animated.View>

        {hasAccounts ? (
          <>
            <Animated.View entering={FadeInDown.delay(200).duration(450)}>
              <AccountSwitcher
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onSelect={setSelectedAccountId}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(450)}>
              <View
                className="mb-5 rounded-2xl border p-5"
                style={{
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.hairline,
                }}
              >
                <Text
                  className="mb-1.5 text-[13px] "
                  style={{
                    color: colors.textSecondary,
                  }}
                >
                  {selectedAccount
                    ? `${selectedAccount.name} balance`
                    : "Total balance"}
                </Text>
                <AnimatedBalance
                  cents={totalBalanceCents}
                  hidden={amountsHidden}
                  className="font-fraunces-medium text-[48px] leading-[52px]"
                />

                {/* ── This month: expense & income (same card) ── */}
                <View
                  className="my-4 h-px"
                  style={{ backgroundColor: colors.hairline }}
                />
                <Text
                  className="font-mono text-[10.5px] uppercase tracking-[0.08em]"
                  style={{ color: colors.textSecondary }}
                >
                  This month
                </Text>
                <View className="mt-3.5 flex-row">
                  <View className="flex-1">
                    <Text
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: colors.textSecondary }}
                    >
                      Expense
                    </Text>
                    <Text
                      className="mt-1 font-mono text-[15px]"
                      style={{ color: colors.textPrimary }}
                    >
                      {amountsHidden
                        ? HIDDEN_AMOUNT
                        : formatCurrency(totalExpenseCents)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: colors.textSecondary }}
                    >
                      Income
                    </Text>
                    <Text
                      className="mt-1 font-mono text-[15px]"
                      style={{ color: colors.sage }}
                    >
                      {amountsHidden
                        ? HIDDEN_AMOUNT
                        : formatCurrency(totalIncomeCents)}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(450)}>
              <WeeklyActivityCard
                earned={earnedByAccount}
                spent={spentByAccount}
                hidden={amountsHidden}
              />
            </Animated.View>

            {categories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-[26px]"
                contentContainerClassName="flex-row gap-3.5"
              >
                {categories.map((category) => (
                  <CategoryRingCard
                    key={category.id}
                    category={category}
                    totalExpenseCents={totalExpenseCents}
                  />
                ))}
              </ScrollView>
            )}

            <View className="mb-3 flex-row items-center justify-between">
              <Text
                className="font-mono text-xs uppercase tracking-[1px] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Recent
              </Text>
              <Text
                className="font-mono text-[11px] "
                style={{ color: colors.textSecondary }}
              >
                {formatMonthLabel()}
              </Text>
            </View>

            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  hidden={amountsHidden}
                />
              ))
            ) : (
              <Text
                className="py-4 text-center text-sm "
                style={{
                  color: colors.textSecondary,
                }}
              >
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
