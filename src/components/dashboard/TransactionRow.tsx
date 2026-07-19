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

import { Text, View } from "react-native";
import type { RecentTransaction } from "@/types";
import { formatRelativeTime, formatSignedCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";

export function TransactionRow({
  transaction,
}: {
  transaction: RecentTransaction;
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
        {formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}
