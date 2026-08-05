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

import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { useColors } from "@/theme/ThemeContext";
import { formatCurrency, HIDDEN_AMOUNT } from "@/lib/format";
import { AccountBadge } from "@/components/dashboard/TransactionRow";
import type { AccountAmountSlice } from "@/types";

// ─── chart geometry ────────────────────────────────────────────────────────────

const PIE_SIZE = 150;
const STROKE_WIDTH = 24;
const RADIUS = (PIE_SIZE - STROKE_WIDTH) / 2;
const CENTER = PIE_SIZE / 2;

/** Point on a circle at `angleDeg` (0° = 12 o'clock, clockwise on screen). */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** SVG path for a donut segment sweeping clockwise from start to end angle. */
function donutArcPath(startAngle: number, endAngle: number): string {
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polar(CENTER, CENTER, RADIUS, startAngle);
  const outerEnd = polar(CENTER, CENTER, RADIUS, endAngle);
  const innerStart = polar(CENTER, CENTER, RADIUS - STROKE_WIDTH, startAngle);
  const innerEnd = polar(CENTER, CENTER, RADIUS - STROKE_WIDTH, endAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${RADIUS - STROKE_WIDTH} ${RADIUS - STROKE_WIDTH} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

// ─── card ──────────────────────────────────────────────────────────────────────

type SegmentKind = "earned" | "spent";

/**
 * Interactive donut chart of the last 7 days: one sage arc for earned
 * (income), one brass arc for spent (expense). Tapping an arc lists the
 * per-account breakdown for that category (badge, name, amount); tapping
 * again returns to the totals.
 */
export function WeeklyActivityCard({
  earned,
  spent,
  hidden = false,
}: {
  earned: AccountAmountSlice[];
  spent: AccountAmountSlice[];
  /** When true, masks amounts (privacy eye toggle on the dashboard). */
  hidden?: boolean;
}) {
  const colors = useColors();
  const [selectedKind, setSelectedKind] = useState<SegmentKind | null>(null);

  const earnedTotal = earned.reduce((sum, s) => sum + s.amountCents, 0);
  const spentTotal = spent.reduce((sum, s) => sum + s.amountCents, 0);
  const grandTotal = earnedTotal + spentTotal;

  const selected =
    selectedKind === "earned"
      ? earned
      : selectedKind === "spent"
        ? spent
        : null;

  const handlePress = (kind: SegmentKind) => {
    setSelectedKind((current) => (current === kind ? null : kind));
  };

  // ── Segment angles (earned first from 12 o'clock, then spent) ───────────
  const earnedFraction = grandTotal > 0 ? earnedTotal / grandTotal : 0;
  const spentFraction = grandTotal > 0 ? spentTotal / grandTotal : 0;
  const showEmptyRing = grandTotal <= 0;
  const isSingleEarned = earnedTotal > 0 && spentTotal === 0;
  const isSingleSpent = spentTotal > 0 && earnedTotal === 0;

  const detailLabel =
    selectedKind === "earned"
      ? "Earned by account"
      : selectedKind === "spent"
        ? "Spent by account"
        : "";

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
        <Svg width={PIE_SIZE} height={PIE_SIZE}>
          {showEmptyRing ? (
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.hairline}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
          ) : isSingleEarned ? (
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.sage}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              onPress={() => handlePress("earned")}
              testID="segment-earned"
            />
          ) : isSingleSpent ? (
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={colors.brass}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              onPress={() => handlePress("spent")}
              testID="segment-spent"
            />
          ) : (
            <>
              <G>
                <Path
                  d={donutArcPath(0, earnedFraction * 360)}
                  fill={colors.sage}
                  opacity={
                    selectedKind !== null && selectedKind !== "earned" ? 0.4 : 1
                  }
                  onPress={() => handlePress("earned")}
                  testID="segment-earned"
                />
              </G>
              <G>
                <Path
                  d={donutArcPath(
                    earnedFraction * 360,
                    (earnedFraction + spentFraction) * 360,
                  )}
                  fill={colors.brass}
                  opacity={
                    selectedKind !== null && selectedKind !== "spent" ? 0.4 : 1
                  }
                  onPress={() => handlePress("spent")}
                  testID="segment-spent"
                />
              </G>
            </>
          )}
        </Svg>
      </View>

      {/* ── Detail: totals, or the tapped category's accounts ── */}
      <View className="mt-4">
        {selected ? (
          <>
            <Text
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: colors.textSecondary }}
            >
              {detailLabel}
            </Text>
            {selected.length === 0 ? (
              <Text
                className="mt-3 text-[13px] font-manrope-semibold"
                style={{ color: colors.textSecondary }}
              >
                Nothing this week
              </Text>
            ) : (
              selected.map((item) => (
                <View
                  key={item.accountId}
                  className="mt-3 flex-row items-center justify-between"
                >
                  <View className="flex-1 flex-row items-center gap-2.5 pr-3">
                    <AccountBadge
                      name={item.accountName}
                      logoKey={item.accountLogoKey}
                      colorHex={item.accountColorHex}
                      size={30}
                    />
                    <Text
                      className="text-[13px] font-manrope-semibold"
                      numberOfLines={1}
                      style={{ color: colors.textPrimary }}
                    >
                      {item.accountName}
                    </Text>
                  </View>
                  <Text
                    className="font-mono text-[14.5px]"
                    style={{ color: colors.textPrimary }}
                  >
                    {hidden ? HIDDEN_AMOUNT : formatCurrency(item.amountCents)}
                  </Text>
                </View>
              ))
            )}
          </>
        ) : (
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: colors.textSecondary }}
              >
                {showEmptyRing ? "No activity" : "Earned"}
              </Text>
              <Text
                className="font-mono text-[14.5px]"
                style={{ color: colors.sage }}
              >
                {hidden ? HIDDEN_AMOUNT : formatCurrency(earnedTotal)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: colors.textSecondary }}
              >
                Spent
              </Text>
              <Text
                className="font-mono text-[14.5px]"
                style={{ color: colors.textPrimary }}
              >
                {hidden ? HIDDEN_AMOUNT : formatCurrency(spentTotal)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
