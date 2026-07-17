import { Text, View } from "react-native";
import type { RecentTransaction } from "@/lib/db/repositories/transactions";
import { formatRelativeDate, formatSignedCurrency } from "@/lib/format";

export function TransactionRow({
  transaction,
}: {
  transaction: RecentTransaction;
}) {
  const isIncome =
    transaction.categoryKind === "income" || transaction.amountCents > 0;

  return (
    <View className="flex-row items-center justify-between border-t border-hairline py-[11px]">
      <View className="flex-1 pr-3">
        <Text
          className="text-[14.5px] font-manrope-semibold text-text-primary"
          numberOfLines={1}
        >
          {transaction.merchant}
        </Text>
        <Text className="mt-0.5 text-[12px] text-text-secondary">
          {transaction.categoryName ?? "Uncategorized"} ·{" "}
          {formatRelativeDate(transaction.occurredAt)}
        </Text>
      </View>
      <Text
        className={`font-mono text-[14.5px] ${isIncome ? "text-sage" : "text-text-primary"}`}
      >
        {formatSignedCurrency(transaction.amountCents)}
      </Text>
    </View>
  );
}
