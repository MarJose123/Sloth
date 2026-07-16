import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import type { CategorySpend } from "@/lib/db/repositories/categories";

interface CategoryRingCardProps {
  category: CategorySpend;
  /** Total expense spend this period — used as the percentage denominator. */
  totalExpenseCents: number;
}

// ─── ring geometry constants ──────────────────────────────────────────────────

const RING_SIZE = 46;
const RING_RADIUS = 20;
const INNER_SIZE = 34;
const INNER_OFFSET = (RING_SIZE - INNER_SIZE) / 2; // 6px
const CENTER = RING_SIZE / 2; // 23
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈125.66

// ─── component ────────────────────────────────────────────────────────────────

export function CategoryRingCard({
  category,
  totalExpenseCents,
}: CategoryRingCardProps) {
  const percent =
    totalExpenseCents > 0
      ? Math.min(
          100,
          Math.round((category.spendCents / totalExpenseCents) * 100),
        )
      : 0;

  // strokeDashoffset shrinks from CIRCUMFERENCE (0%) toward 0 (100%)
  const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <View className="flex-1 items-center rounded-2xl border border-white/[0.09] bg-ink-2 p-3.5">
      {/* ── Progress ring ────────────────────────────────────────────── */}
      <View style={styles.ringContainer}>
        {/* SVG layer: background track + progress arc */}
        <Svg
          width={RING_SIZE}
          height={RING_SIZE}
          style={StyleSheet.absoluteFill}
        >
          {/* Background track — always full circle at hairline opacity */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(243,238,225,0.09)"
            strokeWidth={2.5}
          />

          {/* Progress arc — rotated so 0% starts from 12 o'clock */}
          {percent > 0 && (
            <G transform={`rotate(-90, ${CENTER}, ${CENTER})`}>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={category.colorHex}
                strokeWidth={3}
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </G>
          )}
        </Svg>

        {/* Inner icon circle — absolutely positioned over the SVG */}
        <View
          style={[
            styles.innerCircle,
            { top: INNER_OFFSET, left: INNER_OFFSET },
          ]}
        >
          <Text style={styles.icon}>{category.icon}</Text>
        </View>
      </View>

      {/* ── Category label ───────────────────────────────────────────── */}
      <Text
        className="mt-2 font-mono text-[12px] uppercase text-parchment-dim"
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  innerCircle: {
    position: "absolute",
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    // ink-3 rather than ink-2 so the icon circle reads as a distinct layer
    backgroundColor: "#2E3428",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
});
