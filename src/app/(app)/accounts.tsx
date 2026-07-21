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

import { useCallback } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { documentDirectory } from "expo-file-system/legacy";
import { useAccountsData } from "@/hooks/useAccountsData";
import type { AccountWithBalance } from "@/types";
import { formatCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";
import { resolveLogoSrc } from "@/lib/logoResolver";

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
  const colors = useColors();
  const logoSrc = resolveLogoSrc(account.logoKey);

  const handleEdit = () => {
    router.push("/edit-account?id=" + account.id);
  };

  return (
    <Pressable
      onPress={handleEdit}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80"
      style={{
        backgroundColor: colors.surfaceCard,
        borderColor: colors.hairline,
      }}
    >
      <View
        className="h-[38px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden"
        style={{
          backgroundColor: logoSrc ? "transparent" : account.colorHex,
        }}
      >
        {logoSrc?.type === "bundled" && logoSrc.source ? (
          <Image
            source={logoSrc.source}
            style={{ width: 40, height: 39 }}
            resizeMode="cover"
            className="rounded-2xl"
          />
        ) : logoSrc?.type === "uri" && logoSrc.uri ? (
          <Image
            source={{ uri: `${documentDirectory}${logoSrc.uri}` }}
            style={{ width: 40, height: 39 }}
            resizeMode="cover"
            className="rounded-2xl"
          />
        ) : (
          <Text
            className="font-mono-medium text-xs"
            style={{ color: colors.ink }}
          >
            {initials}
          </Text>
        )}
      </View>

      <View className="flex-1">
        <Text
          className="text-[15.5px] font-manrope-semibold "
          numberOfLines={1}
          style={{ color: colors.textPrimary }}
        >
          {account.name}
        </Text>
        <Text
          className="mt-0.5 font-mono text-[12.5px] "
          style={{ color: colors.textSecondary }}
        >
          {typeLabel}
        </Text>
      </View>

      <Text
        className="font-mono text-[15.5px]"
        style={{
          color:
            account.type === "credit"
              ? account.balanceCents < 0
                ? colors.rust
                : colors.sage
              : colors.textPrimary,
        }}
      >
        {formatCurrency(account.balanceCents)}
      </Text>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { state, refresh } = useAccountsData();
  const colors = useColors();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (state.status === "error") {
    return (
      <View
        className="flex-1 items-center justify-center px-8 pt-safe "
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text
          className="text-center text-sm "
          style={{
            color: colors.rust,
          }}
        >
          {state.message}
        </Text>
      </View>
    );
  }

  const accounts = state.status === "ready" ? state.accounts : [];
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const isLoading = state.status === "loading";

  return (
    <View
      className="flex-1 pt-safe "
      style={{ backgroundColor: colors.surfaceBg }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            style={{ backgroundColor: colors.brass }}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* ── Header ── */}
        <View className="mb-5 flex-row items-center justify-between">
          <Text
            className="font-fraunces-medium text-[22px] "
            style={{ color: colors.textPrimary }}
          >
            Accounts
          </Text>
          <Pressable
            onPress={() => router.push("/add-account")}
            className="active:opacity-60"
          >
            <Text
              className="font-manrope-bold text-[14.5px]"
              style={{ color: colors.brass }}
            >
              + Add
            </Text>
          </Pressable>
        </View>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text
              className="text-sm "
              style={{
                color: colors.textSecondary,
              }}
            >
              Loading your accounts…
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && accounts.length === 0 && (
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
              No accounts yet
            </Text>
            <Text
              className="mb-6 text-center text-sm leading-[1.55] "
              style={{
                color: colors.textSecondary,
              }}
            >
              {
                "Add your first account — checking, savings, credit, or cash — to start tracking your money."
              }
            </Text>
            <Pressable
              onPress={() => router.push("/add-account")}
              className="rounded-2xl bg-brass px-6 py-3.5 active:opacity-80"
            >
              <Text
                className="font-manrope-bold text-sm "
                style={{ color: colors.ink }}
              >
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
              className="mt-1 items-center rounded-2xl border border-dashed py-4 active:opacity-60"
              style={{
                opacity: 0.5,
                borderColor: colors.textSecondary,
              }}
            >
              <Text
                className="text-[14.5px]"
                style={{ color: colors.textSecondary }}
              >
                + Add another account
              </Text>
            </Pressable>

            <Text
              className="mt-5 text-center text-[12px] leading-[1.5] text-balance"
              style={{
                color: colors.textSecondary,
              }}
            >
              {
                "Every account's balance and history is stored only on this device — nothing is uploaded, ever."
              }
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
