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
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { useAmountsVisibility } from "@/hooks/useAmountsVisibility";
import type { CategorySpend } from "@/types";
import { formatCurrency, HIDDEN_AMOUNT } from "@/lib/format";
import { useColors } from "@/theme/ThemeContext";
import { GlowBackdrop } from "@/components/ui/GlowBackdrop";
import { SkeletonList } from "@/components/ui/Skeleton";

// ─── category row ─────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onPress,
}: {
  category: CategorySpend;
  onPress: () => void;
}) {
  const colors = useColors();
  const { amountsHidden } = useAmountsVisibility();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b py-[13px] active:opacity-70"
      style={{
        borderBottomColor: colors.hairline,
      }}
    >
      <View
        className="h-[34px] w-[34px] items-center justify-center rounded-full"
        style={{ backgroundColor: colors.surfaceElevated }}
      >
        <Text style={{ fontSize: 18 }}>{category.icon}</Text>
      </View>

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
          {amountsHidden ? HIDDEN_AMOUNT : formatCurrency(category.spendCents)}
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

  return (
    <View
      className="flex-1 pt-safe "
      style={{ backgroundColor: colors.surfaceBg }}
    >
      {/* Glow layer anchored to the full screen — unaffected by content padding */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlowBackdrop />
      </View>
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
        <Animated.View entering={FadeInDown.duration(450)}>
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
            This month
          </Text>
        </Animated.View>

        {/* ── Loading skeleton ── */}
        {isLoading && (
          <View className="py-2">
            <SkeletonList rows={6} rowHeight={58} />
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
