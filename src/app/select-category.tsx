import { useCallback } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import type { CategorySpend } from "@/types";
import { useColors } from "@/theme/ThemeContext";
import { onCategorySelected } from "@/lib/selectionBus";

export default function SelectCategorySheet() {
  const colors = useColors();
  const { state } = useCategoriesData();
  const categories: CategorySpend[] =
    state.status === "ready" ? state.data.categories : [];
  const status = state.status;

  const handleSelect = useCallback((categoryId: string) => {
    onCategorySelected.emit(categoryId);
    router.back();
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  const expenseCategories = (categories ?? []).filter(
    (c) => c.kind === "expense",
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
        {status === "loading" && (
          <Text
            className="text-center  text-sm font-manrope"
            style={{ color: colors.textSecondary }}
          >
            Loading…
          </Text>
        )}
        {expenseCategories.map((cat) => (
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
        {expenseCategories.length === 0 && status !== "loading" && (
          <Text
            className="text-center text-text-secondary text-sm font-manrope py-8"
            style={{ color: colors.textSecondary }}
          >
            No categories yet.
          </Text>
        )}
      </View>
    </View>
  );
}
