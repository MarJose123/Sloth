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
import Svg, { G, Rect } from "react-native-svg";
import { useColors } from "@/theme/ThemeContext";
import type { DailyTotals } from "@/types";

// ─── chart geometry ────────────────────────────────────────────────────────────

const CHART_HEIGHT = 68;
const BAR_WIDTH = 7;
const BAR_GAP = 3;
const GROUP_GAP = 10;
const BAR_RADIUS = 3;

// ─── legend dot ────────────────────────────────────────────────────────────────

function LegendDot({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View className="flex-row items-center gap-1.5">
      <View
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text
        className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
        style={{ color: colors.textSecondary }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── card ──────────────────────────────────────────────────────────────────────

/**
 * Grouped bar chart of the last 7 days' income (sage) vs expense (brass),
 * scaled to the busiest day. Zero-value days render only the hairline baseline.
 */
export function WeeklyActivityCard({
  dailyTotals,
}: {
  dailyTotals: DailyTotals[];
}) {
  const colors = useColors();

  const max = dailyTotals.reduce(
    (m, d) => Math.max(m, d.expenseCents, d.incomeCents),
    0,
  );
  const scale = max > 0 ? CHART_HEIGHT / max : 0;

  const groupWidth = BAR_WIDTH * 2 + BAR_GAP;
  const chartWidth =
    dailyTotals.length * groupWidth + (dailyTotals.length - 1) * GROUP_GAP;

  return (
    <View
      className="mb-5 rounded-2xl border p-5"
      style={{
        backgroundColor: colors.surfaceCard,
        borderColor: colors.hairline,
      }}
    >
      <Text
        className="font-mono text-[10.5px] uppercase tracking-[0.08em]"
        style={{ color: colors.textSecondary }}
      >
        Activity · last 7 days
      </Text>

      <View className="mt-4 items-center">
        <Svg width={chartWidth} height={CHART_HEIGHT + 4}>
          {/* baseline */}
          <Rect
            x={0}
            y={CHART_HEIGHT}
            width={chartWidth}
            height={1}
            fill={colors.hairline}
          />
          {dailyTotals.map((day, index) => {
            const x = index * (groupWidth + GROUP_GAP);
            const incomeHeight = Math.max(day.incomeCents * scale, 0);
            const expenseHeight = Math.max(day.expenseCents * scale, 0);
            return (
              <G key={day.dayStartEpochMs}>
                <Rect
                  x={x}
                  y={CHART_HEIGHT - incomeHeight}
                  width={BAR_WIDTH}
                  height={incomeHeight}
                  rx={BAR_RADIUS}
                  fill={colors.sage}
                />
                <Rect
                  x={x + BAR_WIDTH + BAR_GAP}
                  y={CHART_HEIGHT - expenseHeight}
                  width={BAR_WIDTH}
                  height={expenseHeight}
                  rx={BAR_RADIUS}
                  fill={colors.brass}
                />
              </G>
            );
          })}
        </Svg>
      </View>

      <View className="mt-4 flex-row justify-center gap-5">
        <LegendDot color={colors.sage} label="Income" />
        <LegendDot color={colors.brass} label="Expense" />
      </View>
    </View>
  );
}
