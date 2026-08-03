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

import { DimensionValue, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/theme/ThemeContext";
import Color from "color";

// One shared loop for every skeleton on screen — declared at module scope
// (AGENTS.md §6) so the React Compiler permits mutating `.value` here.
const SHIMMER_PROGRESS = makeMutable(0);
SHIMMER_PROGRESS.value = withRepeat(
  withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
  -1,
  false,
);

const SHIMMER_BAR_WIDTH = 72;

// ─── shimmer bar ───────────────────────────────────────────────────────────────

function ShimmerBar({ width }: { width: number }) {
  const colors = useColors();
  const barStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          SHIMMER_PROGRESS.value,
          [0, 1],
          [-SHIMMER_BAR_WIDTH, width + SHIMMER_BAR_WIDTH],
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.shimmerBar,
        barStyle,
        { backgroundColor: Color(colors.textPrimary).alpha(0.06).toString() },
      ]}
    />
  );
}

// ─── primitives ────────────────────────────────────────────────────────────────

/** A shimmering rounded rectangle of the given size. */
export function Skeleton({
  width,
  height,
  radius = 8,
}: {
  width: DimensionValue;
  height: number;
  radius?: number;
}) {
  const colors = useColors();
  // The shimmer bar only needs a nominal traverse distance; the container's
  // overflow:hidden clips it to the actual (possibly percentage) width.
  const barTraverse = typeof width === "number" ? width : 220;
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        backgroundColor: colors.surfaceElevated,
      }}
    >
      <ShimmerBar width={barTraverse} />
    </View>
  );
}

/** A shimmering circle, used for avatar/icon placeholders. */
export function SkeletonCircle({ size }: { size: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

/**
 * A list-shaped skeleton: `rows` of (icon circle + two text lines),
 * mirroring the layout of list rows across the app.
 */
export function SkeletonList({
  rows = 3,
  rowHeight = 64,
}: {
  rows?: number;
  rowHeight?: number;
}) {
  return (
    <View>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            height: rowHeight,
          }}
        >
          <SkeletonCircle size={36} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="100%" height={13} radius={6} />
            <Skeleton width="60%" height={11} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shimmerBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SHIMMER_BAR_WIDTH,
    transform: [{ translateX: -SHIMMER_BAR_WIDTH }],
  },
});
