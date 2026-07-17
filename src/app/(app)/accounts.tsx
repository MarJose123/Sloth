import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAccountsData } from "@/hooks/useAccountsData";
import type { AccountWithBalance } from "@/lib/db/repositories/accounts";
import { formatCurrency } from "@/lib/format";

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
  savings: "SAVINGS",
  credit: "CREDIT",
  cash: "CASH",
};

// ─── AccountCard ──────────────────────────────────────────────────────────────

function AccountCard({ account }: { account: AccountWithBalance }) {
  const initials = getInitials(account.name);
  const typeLabel = TYPE_LABELS[account.type] ?? account.type.toUpperCase();

  const balanceClassName =
    account.type === "credit"
      ? account.balanceCents < 0
        ? "text-rust"
        : "text-sage"
      : "text-text-primary";

  return (
    <Pressable className="mb-3 flex-row items-center gap-3 rounded-2xl border border-hairline bg-surface-card p-4 active:opacity-80">
      <View
        className="h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: account.colorHex }}
      >
        <Text className="font-mono-medium text-xs text-ink">{initials}</Text>
      </View>

      <View className="flex-1">
        <Text
          className="text-[15.5px] font-manrope-semibold text-text-primary"
          numberOfLines={1}
        >
          {account.name}
        </Text>
        <Text className="mt-0.5 font-mono text-[12.5px] text-text-secondary">
          {typeLabel}
        </Text>
      </View>

      <Text className={`font-mono text-[15.5px] ${balanceClassName}`}>
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
      <View className="flex-1 items-center justify-center px-8 pt-safe bg-surface-bg">
        <Text className="text-center text-sm text-rust">{state.message}</Text>
      </View>
    );
  }

  const accounts = state.status === "ready" ? state.accounts : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading = state.status === "loading";

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            className="bg-brass"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* ── Header ── */}
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="font-fraunces-medium text-[22px] text-text-primary">
            Accounts
          </Text>
          <Pressable
            onPress={() => router.push("/add-account")}
            className="active:opacity-60"
          >
            <Text className="font-manrope-bold text-[14.5px] text-brass">
              + Add
            </Text>
          </Pressable>
        </View>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text className="text-sm text-text-secondary">
              Loading your accounts…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && accounts.length === 0 && (
          <View className="items-center rounded-2xl border border-hairline bg-surface-card px-6 py-10">
            <Text className="mb-2 font-fraunces-medium text-xl text-text-primary">
              No accounts yet
            </Text>
            <Text className="mb-6 text-center text-sm leading-[1.55] text-text-secondary">
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
              className="mt-1 items-center rounded-2xl border border-dashed border-text-secondary py-4 active:opacity-60"
              style={{ opacity: 0.5 }}
            >
              <Text className="text-[14.5px] text-text-secondary">
                + Add another account
              </Text>
            </Pressable>

            <Text className="mt-5 text-center text-[12px] leading-[1.5] text-text-secondary">
              {"Every account's balance and history is stored only on this"}
              {"device — nothing is uploaded, ever."}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
