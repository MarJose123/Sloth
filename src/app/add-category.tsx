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
  insertCategory,
  updateCategory,
} from "@/lib/db/repositories/categories";
import type { CategoryKind } from "@/types";
import { useColors } from "@/theme/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  const colors = useColors();
  const SIZE = 58;
  const RADIUS = 26;
  const CENTER = SIZE / 2;
  return (
    <View style={styles.previewContainer}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={colors.hairline}
          strokeWidth={2}
        />
      </Svg>
      <View style={styles.previewInner}>
        <Text style={styles.previewIcon}>{icon}</Text>
      </View>
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = "#C87B54";

export default function CategoryEditorScreen() {
  const colors = useColors();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const categoryId = params.id;
  const isEditing = !!categoryId;

  const [isLoadingData, setIsLoadingData] = useState(isEditing);
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

  // Pre-populate fields when editing an existing category
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await getCategoryById(categoryId);
        if (cancelled || !existing) return;
        reset({
          name: existing.name,
          icon: existing.icon,
          kind: existing.kind,
        });
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, reset]);

  const onSubmit = useCallback(
    async (data: CategoryFormData) => {
      setIsSaving(true);
      try {
        if (isEditing && categoryId) {
          await updateCategory(categoryId, {
            name: data.name.trim(),
            icon: data.icon,
            colorHex: DEFAULT_COLOR,
            kind: data.kind,
          });
        } else {
          await insertCategory({
            name: data.name.trim(),
            icon: data.icon,
            colorHex: DEFAULT_COLOR,
            kind: data.kind,
          });
        }
        router.back();
      } catch (err) {
        toast.error("Could not save", {
          description:
            err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [isEditing, categoryId, toast],
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

  if (isLoadingData) {
    return (
      <View
        className="flex-1 items-center justify-center pt-safe "
        style={{ backgroundColor: colors.surfaceBg }}
      >
        <Text className="text-sm" style={{ color: colors.textSecondary }}>
          {"Loading\u2026"}
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 pt-safe "
      style={{ backgroundColor: colors.surfaceBg }}
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
                className="text-[14.5px] text-text-secondary"
                style={{ color: colors.textSecondary }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text className="font-fraunces-medium text-[20px] text-text-primary">
              {isEditing ? "Edit category" : "New category"}
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
                style={{ color: colors.textSecondary }}
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
                  style={{ color: colors.rust }}
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
            style={{ color: colors.brass }}
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
                    borderColor: active
                      ? Color(colors.brass).alpha(0.5).toString()
                      : colors.hairline,
                    backgroundColor: active
                      ? Color(colors.brass).alpha(0.1).toString()
                      : colors.surfaceCard,
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
              style={{
                color: colors.ink,
              }}
            >
              {isSaving
                ? "Saving\u2026"
                : isEditing
                  ? "Update category"
                  : "Create category"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
