import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Svg, { Circle, G } from "react-native-svg";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import type { CategorySpend } from "@/types";
import { formatCurrency } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";

// ─── ring geometry ────────────────────────────────────────────────────────────

const RING_SIZE = 44;
const RING_RADIUS = 19;
const INNER_SIZE = 34;
const INNER_OFFSET = (RING_SIZE - INNER_SIZE) / 2; // 5
const CENTER = RING_SIZE / 2; // 22
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈119.38

// ─── list ring icon ───────────────────────────────────────────────────────────

function CategoryListRing({
  category,
  totalExpenseCents,
}: {
  category: CategorySpend;
  totalExpenseCents: number;
}) {
  const colors = useColors();
  // Income categories always show a full ring
  const percent =
    category.kind === "income"
      ? 100
      : totalExpenseCents > 0
        ? Math.min(
            100,
            Math.round((category.spendCents / totalExpenseCents) * 100),
          )
        : 0;

  const strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={colors.hairline}
          strokeWidth={2}
        />
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
      <View
        style={[styles.innerCircle, { top: INNER_OFFSET, left: INNER_OFFSET }]}
      >
        <Text style={styles.icon}>{category.icon}</Text>
      </View>
    </View>
  );
}

// ─── category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  totalExpenseCents,
  onPress,
}: {
  category: CategorySpend;
  totalExpenseCents: number;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b py-[13px] active:opacity-70"
      style={{
        borderBottomColor: colors.hairline,
      }}
    >
      <CategoryListRing
        category={category}
        totalExpenseCents={totalExpenseCents}
      />

      <View className="flex-1">
        <Text
          className="text-[14.5px] font-manrope-semibold "
          style={{ color: colors.textPrimary }}
        >
          {category.name}
        </Text>
        <Text
          className="mt-0.5 font-mono text-[12px] uppercase "
          style={{ color: colors.textSecondary }}
        >
          {category.kind}
        </Text>
      </View>

      <View className="items-end">
        <Text
          className="font-mono text-[13.5px] "
          style={{ color: colors.textPrimary }}
        >
          {formatCurrency(category.spendCents)}
        </Text>
        <Text
          className="mt-0.5 font-mono text-[11px] "
          style={{ color: colors.textSecondary }}
        >
          {category.transactionCount}{" "}
          {category.transactionCount === 1 ? "transaction" : "transactions"}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const { state, refresh } = useCategoriesData();

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const colors = useColors();
  const isLoading = state.status === "loading";
  const isRefreshing = state.status === "ready" ? state.isRefreshing : false;
  const categories = state.status === "ready" ? state.data.categories : [];
  const totalExpenseCents =
    state.status === "ready" ? state.data.totalExpenseCents : 0;

  return (
    <View
      className="flex-1 pt-safe "
      style={{ backgroundColor: colors.surfaceBg }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brass}
          />
        }
      >
        {/* ── Header ── */}
        <View className="mb-1 flex-row items-center justify-between">
          <Text
            className="font-fraunces-medium text-[22px] "
            style={{ color: colors.textPrimary }}
          >
            Categories
          </Text>
          <Pressable
            onPress={() => router.push("/add-category")}
            className="active:opacity-60"
          >
            <Text
              className="font-manrope-bold text-[14.5px] "
              style={{ color: colors.brass }}
            >
              + Add
            </Text>
          </Pressable>
        </View>

        <Text
          className="mb-5 text-[12px] "
          style={{ color: colors.textSecondary }}
        >
          This month · ring shows share of total spend
        </Text>

        {/* ── Loading ── */}
        {isLoading && (
          <View className="items-center py-14">
            <Text className="text-sm " style={{ color: colors.textSecondary }}>
              Loading categories…
            </Text>
          </View>
        )}

        {/* ── Error ── */}
        {state.status === "error" && (
          <View className="items-center py-14">
            <Text
              className="text-center text-sm "
              style={{ color: colors.rust }}
            >
              {state.message}
            </Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!isLoading && state.status !== "error" && categories.length === 0 && (
          <View
            className="items-center rounded-2xl border px-6 py-10"
            style={{
              borderColor: colors.hairline,
              backgroundColor: colors.surfaceCard,
            }}
          >
            <Text
              className="mb-2 font-fraunces-medium text-xl "
              style={{ color: colors.textPrimary }}
            >
              No categories yet
            </Text>
            <Text
              className="mb-6 text-center text-sm leading-[1.55] "
              style={{ color: colors.textSecondary }}
            >
              Create expense and income types to organize your transactions.
            </Text>
            <Pressable
              onPress={() => router.push("/add-category")}
              className="rounded-2xl  px-6 py-3.5 active:opacity-80"
              style={{
                backgroundColor: colors.brass,
              }}
            >
              <Text
                className="font-manrope-bold text-sm "
                style={{
                  color: colors.ink,
                }}
              >
                Create category
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Category list ── */}
        {!isLoading &&
          categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              totalExpenseCents={totalExpenseCents}
              onPress={() =>
                router.push({
                  pathname: "/edit-category",
                  params: { id: category.id },
                })
              }
            />
          ))}

        {/* ── Add-more dashed row ── */}
        {!isLoading && categories.length > 0 && (
          <Pressable
            onPress={() => router.push("/add-category")}
            className="mt-3.5 items-center rounded-2xl border border-dashed py-4 active:opacity-60"
            style={{
              opacity: 0.5,
              borderColor: colors.textSecondary,
            }}
          >
            <Text
              className="text-[14.5px] text-text-secondary"
              style={{
                color: colors.textSecondary,
              }}
            >
              + Create a new expense type
            </Text>
          </Pressable>
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
});
