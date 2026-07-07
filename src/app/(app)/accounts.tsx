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
import { useAccountsData } from "@/hooks/useAccountsData";
import type { AccountWithBalance } from "@/lib/db/repositories/accounts";
import { formatCurrency } from "@/lib/format";
import { colors } from "@/theme/colors";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

const TYPE_LABELS: Record<string, string> = {
  checking: "CHECKING",
  savings:  "SAVINGS",
  credit:   "CREDIT",
  cash:     "CASH",
};

// ─── AccountCard ──────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: AccountWithBalance }) {
  const initials   = getInitials(account.name);
  const typeLabel  = TYPE_LABELS[account.type] ?? account.type.toUpperCase();

  const balanceColor: string =
    account.type === "credit"
      ? account.balanceCents < 0
        ? colors.rust
        : colors.sage
      : colors.parchment;

  return (
    <Pressable className="mb-3 flex-row items-center gap-3 rounded-2xl border border-white/[0.09] bg-ink-2 p-4 active:opacity-80">
      <View
        className="h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: account.colorHex }}
      >
        <Text
          className="font-mono-medium text-xs"
          style={{ color: colors.ink }}
        >
          {initials}
        </Text>
      </View>

      <View className="flex-1">
        <Text
          className="text-sm font-manrope-semibold text-parchment"
          numberOfLines={1}
        >
          {account.name}
        </Text>
        <Text className="mt-0.5 font-mono text-[11.5px] text-parchment-dim">
          {typeLabel}
        </Text>
      </View>

      <Text className="font-mono text-sm" style={{ color: balanceColor }}>
        {formatCurrency(account.balanceCents)}
      </Text>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { state, refresh } = useAccountsData();

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

  const accounts     = state.status === "ready" ? state.accounts : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading    = state.status === "loading";

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }}
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
            Accounts
          </Text>
          <Pressable
            onPress={() => router.push("/add-account")}
            className="active:opacity-60"
          >
            <Text className="font-manrope-bold text-[13px] text-brass">
              + Add
            </Text>
          </Pressable>
        </View>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text className="text-sm text-parchment-dim">
              Loading your accounts…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && accounts.length === 0 && (
          <View className="items-center rounded-2xl border border-white/[0.09] bg-ink-2 px-6 py-10">
            <Text className="mb-2 font-fraunces-medium text-xl text-parchment">
              No accounts yet
            </Text>
            <Text className="mb-6 text-center text-sm leading-[1.55] text-parchment-dim">
              Add your first account — checking, savings, credit, or cash — to
              start tracking your money.
            </Text>
            <Pressable
              onPress={() => router.push("/add-account")}
              className="rounded-2xl bg-brass px-6 py-3.5 active:opacity-80"
            >
              <Text className="font-manrope-bold text-sm text-ink">
                Add account
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Account cards ── */}
        {!isLoading && accounts.length > 0 && (
          <>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}

            <Pressable
              onPress={() => router.push("/add-account")}
              className="mt-1 items-center rounded-2xl border border-dashed border-parchment/20 py-4 active:opacity-60"
            >
              <Text className="text-[13px] text-parchment-dim">
                + Add another account
              </Text>
            </Pressable>

            <Text className="mt-5 text-center text-[11px] leading-[1.5] text-parchment-dim">
              Every account&apos;s balance and history is stored only on this
              device — nothing is uploaded, ever.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
