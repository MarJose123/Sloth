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

import { Image, Text, View } from "react-native";
import { documentDirectory } from "expo-file-system/legacy";
import type { RecentTransaction } from "@/types";
import {
  formatRelativeTime,
  formatSignedCurrency,
  HIDDEN_AMOUNT,
} from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";
import { resolveLogoSrc } from "@/lib/logoResolver";

/** Two-letter initials from an account name, matching the accounts list. */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

/** Small account badge — bank/custom logo image, or color + initials fallback. */
export function AccountBadge({
  name,
  logoKey,
  colorHex,
  size = 30,
}: {
  name: string;
  logoKey: string | null;
  colorHex: string;
  size?: number;
}) {
  const colors = useColors();
  const logoSrc = resolveLogoSrc(logoKey);
  const radius = Math.round(size * 0.33);

  if (logoSrc?.type === "bundled" && logoSrc.source) {
    return (
      <Image
        source={logoSrc.source}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  if (logoSrc?.type === "uri" && logoSrc.uri) {
    return (
      <Image
        source={{ uri: `${documentDirectory}${logoSrc.uri}` }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colorHex,
      }}
    >
      <Text
        className="font-mono-medium"
        style={{ color: colors.ink, fontSize: Math.round(size * 0.35) }}
        numberOfLines={1}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

export function TransactionRow({
  transaction,
  hidden = false,
}: {
  transaction: RecentTransaction;
  /** When true, masks the amount (privacy eye toggle on the dashboard). */
  hidden?: boolean;
}) {
  const colors = useColors();
  const isIncome =
    transaction.categoryKind === "income" || transaction.amountCents > 0;

  return (
    <View
      className="flex-row items-center justify-between border-t  py-[11px]"
      style={{
        borderTopColor: colors.hairline,
      }}
    >
      <View className="mr-3 flex-shrink-0">
        <AccountBadge
          name={transaction.accountName}
          logoKey={transaction.accountLogoKey}
          colorHex={transaction.accountColorHex}
        />
      </View>
      <View className="flex-1 pr-3">
        <Text
          className="text-[14.5px] font-manrope-semibold text-text-primary"
          numberOfLines={1}
          style={{
            color: colors.textPrimary,
          }}
        >
          {transaction.merchant}
        </Text>
        <Text
          className="mt-0.5 text-[12px] "
          style={{
            color: colors.textSecondary,
          }}
        >
          {transaction.categoryName ?? "Uncategorized"} ·{" "}
          {formatRelativeTime(transaction.occurredAt)}
        </Text>
      </View>
      <Text
        className="font-mono text-[14.5px]"
        style={{
          color: isIncome ? colors.sage : colors.textPrimary,
        }}
      >
        {hidden ? HIDDEN_AMOUNT : formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}
