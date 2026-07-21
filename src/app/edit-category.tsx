/**
 * Edit category screen — Screen 10 (edit variant).
 *
 * A dedicated edit-only screen for categories, following the same pattern
 * as edit-account.tsx. Pre-populates name, icon, and kind from the existing
 * category data and saves via updateCategory.
 */

import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import {
  getCategoryById,
  updateCategory,
} from "@/lib/db/repositories/categories";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import { useToast } from "@/hooks/useToast";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CategoryKind } from "@/types";
import Color from "color";

// ─── schema ────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Enter a category name"),
  icon: z.string().min(1),
  kind: z.enum(["expense", "income"]),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ─── icon library ─────────────────────────────────────────────────────────────

const ICONS = [
  "🛒",
  "🍽",
  "🚈",
  "🏠",
  "💊",
  "🎬",
  "✈",
  "📱",
  "🐾",
  "👕",
  "💡",
  "⚽",
  "📚",
  "🎮",
  "💇",
  "🚗",
  "💰",
  "🎁",
  "🏋",
  "🧘",
  "☕",
  "🎵",
] as const;

// ─── ring preview (full circle, 58px) ────────────────────────────────────────

function PreviewRing({ icon }: { icon: string }) {
  const c = useColors();
  const SIZE = 58;
  const RADIUS = 26;
  const CENTER = SIZE / 2;
  const ringColor = c.brass;
  return (
    <View style={styles.previewContainer}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={3}
        />
      </Svg>
      <View style={[styles.previewInner, { backgroundColor: ringColor }]}>
        <Text style={styles.previewIcon}>{icon}</Text>
      </View>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function EditCategoryScreen() {
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: "🛒",
      kind: "expense",
    },
  });

  const selectedIcon = useWatch({ control, name: "icon" });
  const kind = useWatch({ control, name: "kind" });

  // ── Load category data ──────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await getCategoryById(id);
        if (cancelled || !existing) {
          if (!cancelled && !existing) {
            toast.error("Category not found");
            router.back();
          }
          return;
        }
        reset({
          name: existing.name,
          icon: existing.icon,
          kind: existing.kind,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save handler ────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    async (data: CategoryFormData) => {
      if (!id) return;
      setIsSaving(true);
      try {
        await updateCategory(id, {
          name: data.name.trim(),
          icon: data.icon,
          colorHex: colors.brass,
          kind: data.kind,
        });
        router.back();
      } catch (err) {
        toast.error("Could not save changes", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [id, toast],
  );

  const handleSave = handleSubmit(onSubmit, (fieldErrors) => {
    const entry = Object.entries(fieldErrors)[0];
    if (entry) {
      const [fieldName, error] = entry;
      const label =
        fieldName === "kind"
          ? "Type"
          : fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      toast.warning(label, { description: error.message as string });
    }
  });

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center pt-safe "
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text
          className="text-sm  font-manrope"
          style={{ color: colors.textSecondary }}
        >
          {"Loading\u2026"}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 pt-safe "
      style={{
        backgroundColor: colors.surfaceBg,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View className="mb-6 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text
                className="text-[14.5px] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              className="font-fraunces-medium text-[20px] "
              style={{ color: colors.textPrimary }}
            >
              Edit category
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="active:opacity-60"
            >
              <Text
                className="font-manrope-bold text-[13px] "
                style={{ opacity: isSaving ? 0.4 : 1, color: colors.brass }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* ── Preview + name ── */}
          <View className="mb-6 flex-row items-center gap-3.5">
            <PreviewRing icon={selectedIcon} />
            <View
              className="flex-1 rounded-2xl border  px-4 py-3.5"
              style={{
                borderColor: colors.hairline,
                backgroundColor: colors.surfaceCard,
              }}
            >
              <Text
                className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] "
                style={{
                  color: colors.textSecondary,
                }}
              >
                Name
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="e.g. Groceries"
                    placeholderTextColor={colors.textSecondary}
                    className="text-[14px] "
                    autoCapitalize="words"
                    returnKeyType="done"
                    style={{
                      color: colors.textPrimary,
                    }}
                  />
                )}
              />
              {errors.name && (
                <Text
                  className="mt-1 font-mono text-[10px] "
                  style={{
                    color: colors.rust,
                  }}
                >
                  {errors.name.message}
                </Text>
              )}
            </View>
          </View>

          {/* ── Icon picker ── */}
          <Text
            className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] "
            style={{
              color: colors.brass,
            }}
          >
            Icon
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {ICONS.map((icon) => {
              const active = selectedIcon === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() =>
                    setValue("icon", icon, { shouldValidate: true })
                  }
                  className="h-11 w-11 items-center justify-center rounded-[11px] border active:opacity-70"
                  style={{
                    backgroundColor: active
                      ? Color(colors.brass).alpha(0.1).toString()
                      : colors.surfaceCard,
                    borderColor: active
                      ? Color(colors.brass).alpha(0.6).toString()
                      : colors.hairline,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Type selector ── */}
          <Text
            className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] "
            style={{
              color: colors.brass,
            }}
          >
            Type
          </Text>
          <View className="mb-8 flex-row gap-2">
            {(["expense", "income"] as CategoryKind[]).map((kindOpt) => {
              const active = kind === kindOpt;
              return (
                <Pressable
                  key={kindOpt}
                  onPress={() =>
                    setValue("kind", kindOpt, { shouldValidate: true })
                  }
                  className="flex-1 flex-row items-center gap-2 rounded-2xl border p-3.5 active:opacity-80"
                  style={{
                    backgroundColor: active
                      ? Color(colors.brass).alpha(0.1).toString()
                      : colors.surfaceCard,
                    borderColor: active
                      ? Color(colors.brass).alpha(0.5).toString()
                      : colors.hairline,
                  }}
                >
                  <Text
                    className="text-base font-manrope-bold"
                    style={{
                      color: active ? colors.brass : colors.textSecondary,
                    }}
                  >
                    {kindOpt === "expense" ? "\u2212" : "+"}
                  </Text>
                  <Text
                    className="text-[12.5px] font-manrope-semibold capitalize"
                    style={{
                      color: active ? colors.textPrimary : colors.textSecondary,
                    }}
                  >
                    {kindOpt}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="rounded-2xl  py-4 active:opacity-80"
            style={{
              opacity: isSaving ? 0.6 : 1,
              backgroundColor: colors.brass,
            }}
          >
            <Text
              className="text-center font-manrope-bold text-sm "
              style={{ color: colors.ink }}
            >
              {isSaving ? "Saving\u2026" : "Save changes"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  previewContainer: {
    width: 58,
    height: 58,
  },
  previewInner: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  previewIcon: {
    fontSize: 24,
  },
});
