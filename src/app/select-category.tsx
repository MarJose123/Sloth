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

import { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { listAllCategories } from "@/lib/db/repositories/categories";
import type { AccountType, Category } from "@/types";
import { useColors } from "@/theme/ThemeContext";
import { onCategorySelected } from "@/lib/selectionBus";
import {
  allowedCategoryEmptyHint,
  allowedCategoryKinds,
} from "@/lib/transactionFlow";
import { SkeletonList } from "@/components/ui/Skeleton";

export default function SelectCategorySheet() {
  const colors = useColors();
  const { accountType } = useLocalSearchParams<{ accountType?: string }>();
  const [categories, setCategories] = useState<Category[] | null>(null);

  // Reads the DB directly (same query as the Add Transaction guard) so the
  // sheet can never show a stale/empty list while categories exist. Reloads
  // on every focus so a category created moments ago appears immediately.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const cats = await listAllCategories();
          if (!cancelled) setCategories(cats);
        } catch {
          if (!cancelled) setCategories([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleSelect = useCallback((categoryId: string) => {
    onCategorySelected.emit(categoryId);
    router.back();
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  const loading = categories === null;
  const allowedKinds = allowedCategoryKinds(accountType as AccountType);
  const pickerCategories = (categories ?? []).filter((cat) =>
    allowedKinds.includes(cat.kind),
  );

  return (
    <View
      className="flex-1 justify-end"
      style={{ backgroundColor: "rgba(8,9,13,0.6)" }}
    >
      <Pressable
        onPress={handleDismiss}
        className="flex-1"
        accessibilityLabel="Close"
        accessibilityRole="button"
      />
      <View
        className="rounded-t-[22px] border-t px-5 pb-8 pt-2"
        style={{
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.hairline,
        }}
      >
        <View className="mb-5 items-center">
          <View
            className="h-1 w-9 rounded-full"
            style={{ backgroundColor: colors.hairline }}
          />
        </View>
        <Text
          className="mb-6 text-center font-fraunces-medium text-lg"
          style={{ color: colors.textPrimary }}
        >
          Select Category
        </Text>
        {loading && (
          <View className="py-2">
            <SkeletonList rows={4} rowHeight={58} />
          </View>
        )}
        {pickerCategories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => handleSelect(cat.id)}
            className="mb-2.5 flex-row items-center gap-4 rounded-2xl border px-4 py-3.5 active:opacity-70"
            style={{
              borderColor: colors.hairline,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full border">
              <Text className="text-lg">{cat.icon}</Text>
            </View>
            <View className="flex-1">
              <Text
                className="font-manrope-bold text-[13px]"
                style={{ color: colors.textPrimary }}
              >
                {cat.name}
              </Text>
              <Text
                className="text-[11.5px] leading-4 uppercase"
                style={{ color: colors.textSecondary }}
              >
                {cat.kind}
              </Text>
            </View>
          </Pressable>
        ))}
        {!loading && pickerCategories.length === 0 && (
          <Text
            className="text-center text-sm font-manrope py-8"
            style={{ color: colors.textSecondary }}
          >
            {allowedCategoryEmptyHint(accountType as AccountType)}
          </Text>
        )}
      </View>
    </View>
  );
}
