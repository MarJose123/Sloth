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
import { Image, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { documentDirectory } from "expo-file-system/legacy";
import { useAccountsData } from "@/hooks/useAccountsData";
import type { AccountWithBalance } from "@/types";
import { formatCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";
import { onAccountSelected } from "@/lib/selectionBus";
import { resolveLogoSrc } from "@/lib/logoResolver";

// ─── helpers ────────────────────────────────────────────────────────────

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

// ─── Account row ─────────────────────────────────────────────────────────

function AccountRow({
  account,
  onSelect,
}: {
  account: AccountWithBalance;
  onSelect: (id: string) => void;
}) {
  const colors = useColors();
  const logoSrc = resolveLogoSrc(account.logoKey);
  const initials = getInitials(account.name);
  const typeLabel = TYPE_LABELS[account.type] ?? account.type.toUpperCase();

  const balanceColor =
    account.type === "credit"
      ? account.balanceCents < 0
        ? colors.rust
        : colors.sage
      : colors.textPrimary;

  return (
    <Pressable
      onPress={() => onSelect(account.id)}
      className="mb-2.5 flex-row items-center gap-4 rounded-2xl border px-4 py-3.5 active:opacity-70"
      style={{
        borderColor: colors.hairline,
        backgroundColor: colors.surfaceElevated,
      }}
    >
      {/* ── Badge ── */}
      <View
        className="h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{
          backgroundColor: logoSrc ? "transparent" : account.colorHex,
        }}
      >
        {logoSrc?.type === "bundled" && logoSrc.source ? (
          <Image
            source={logoSrc.source}
            style={{ width: 46, height: 46 }}
            resizeMode="cover"
          />
        ) : logoSrc?.type === "uri" && logoSrc.uri ? (
          <Image
            source={{ uri: `${documentDirectory}${logoSrc.uri}` }}
            style={{ width: 46, height: 46 }}
            resizeMode="cover"
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

      {/* ── Name + type ── */}
      <View className="flex-1">
        <Text
          className="font-manrope-bold text-[13px]"
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {account.name}
        </Text>
        <Text
          className="mt-0.5 font-mono text-[11px]"
          style={{ color: colors.textSecondary }}
        >
          {typeLabel}
        </Text>
      </View>

      {/* ── Balance ── */}
      <Text className="font-mono text-[13.5px]" style={{ color: balanceColor }}>
        {formatCurrency(account.balanceCents)}
      </Text>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────

export default function SelectAccountSheet() {
  const colors = useColors();
  const { state } = useAccountsData();
  const accounts: AccountWithBalance[] =
    state.status === "ready" ? state.accounts : [];
  const status = state.status;

  const handleSelect = useCallback((accountId: string) => {
    onAccountSelected.emit(accountId);
    router.back();
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  return (
    <View
      className="flex-1 justify-end"
      style={{ backgroundColor: "rgba(8,9,13,0.6)" }}
    >
      <Pressable
        onPress={handleDismiss}
        className="flex-1"
        accessibilityLabel="Close"
        accessibilityRole="button"
      />
      <View
        className="rounded-t-[22px] border-t px-5 pb-8 pt-2"
        style={{
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.hairline,
        }}
      >
        <View className="mb-5 items-center">
          <View
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: colors.hairline }}
          />
        </View>
        <Text
          className="mb-6 text-center font-fraunces-medium text-lg"
          style={{ color: colors.textPrimary }}
        >
          Select Account
        </Text>
        {status === "loading" && (
          <Text
            className="text-center  text-sm font-manrope"
            style={{
              color: colors.textSecondary,
            }}
          >
            Loading…
          </Text>
        )}
        {accounts?.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            onSelect={handleSelect}
          />
        ))}
        {accounts?.length === 0 && status !== "loading" && (
          <Text
            className="text-center  text-sm font-manrope py-8"
            style={{ color: colors.textSecondary }}
          >
            No accounts yet. Create one first.
          </Text>
        )}
      </View>
    </View>
  );
}
