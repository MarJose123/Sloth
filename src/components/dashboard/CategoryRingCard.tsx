import { Text, View } from "react-native";
import type { CategorySpend } from "@/lib/db/repositories/categories";

interface CategoryRingCardProps {
  category: CategorySpend;
  /** Total expense spend this period, used as the percentage denominator. */
  totalExpenseCents: number;
}

export function CategoryRingCard({
  category,
  totalExpenseCents,
}: CategoryRingCardProps) {
  const percent =
    totalExpenseCents > 0
      ? Math.round((category.spendCents / totalExpenseCents) * 100)
      : 0;

  return (
    <View className="flex-1 items-center rounded-2xl border border-white/[0.09] bg-ink-2 p-3.5">
      <View
        className="mb-2 h-[46px] w-[46px] items-center justify-center rounded-full"
        style={{ borderWidth: 3, borderColor: category.colorHex }}
      >
        <Text className="font-mono text-[10px] text-parchment">{percent}%</Text>
      </View>
      <Text className="text-[11px] text-parchment-dim" numberOfLines={1}>
        {category.name}
      </Text>
    </View>
  );
}
