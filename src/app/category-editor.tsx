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
  type CategoryKind,
} from "@/lib/db/repositories/categories";
import { useColors } from "@/theme/ThemeContext";
import { useToast } from "@/hooks/useToast";

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
  const ringColor = colors.brass;
  return (
    <View style={styles.previewContainer}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={ringColor}
          strokeWidth={1}
        />
      </Svg>
      <View style={[styles.previewInner, { backgroundColor: "transparent" }]}>
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

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("🛒");
  const [selectedKind, setSelectedKind] = useState<CategoryKind>("expense");
  const [isLoadingData, setIsLoadingData] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-populate fields when editing an existing category
  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await getCategoryById(categoryId);
        if (cancelled || !existing) return;
        setName(existing.name);
        setSelectedIcon(existing.icon);
        setSelectedKind(existing.kind);
      } finally {
        if (!cancelled) setIsLoadingData(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.warning("Missing name", {
        description: "Please enter a category name.",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && categoryId) {
        await updateCategory(categoryId, {
          name: trimmedName,
          icon: selectedIcon,
          colorHex: DEFAULT_COLOR,
          kind: selectedKind,
        });
      } else {
        await insertCategory({
          name: trimmedName,
          icon: selectedIcon,
          colorHex: DEFAULT_COLOR,
          kind: selectedKind,
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
  }, [name, selectedIcon, selectedKind, isEditing, categoryId, toast]);

  if (isLoadingData) {
    return (
      <View className="flex-1 items-center justify-center pt-safe bg-surface-bg">
        <Text className="text-sm text-text-secondary">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
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
              <Text className="text-[14.5px] text-text-secondary">Cancel</Text>
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
                className="font-manrope-bold text-[13px] text-brass"
                style={{ opacity: isSaving ? 0.4 : 1 }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* ── Preview + name ── */}
          <View className="mb-6 flex-row items-center gap-3.5">
            <PreviewRing icon={selectedIcon} />
            <View className="flex-1 rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
              <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Groceries"
                placeholderTextColor={colors.textSecondary}
                className="text-[14px] text-text-primary"
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Icon picker ── */}
          <Text className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
            Icon
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {ICONS.map((icon) => {
              const active = selectedIcon === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  className={`h-11 w-11 items-center justify-center rounded-[11px] border active:opacity-70 ${
                    active
                      ? "border-brass/60 bg-brass/10"
                      : "border-hairline bg-surface-card"
                  }`}
                >
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Type selector ── */}
          <Text className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
            Type
          </Text>
          <View className="mb-8 flex-row gap-2">
            {(["expense", "income"] as CategoryKind[]).map((kind) => {
              const active = selectedKind === kind;
              return (
                <Pressable
                  key={kind}
                  onPress={() => setSelectedKind(kind)}
                  className={`flex-1 flex-row items-center gap-2 rounded-2xl border p-3.5 active:opacity-80 ${
                    active
                      ? "border-brass/50 bg-brass/10"
                      : "border-hairline bg-surface-card"
                  }`}
                >
                  <Text
                    className={`text-base font-manrope-bold ${
                      active ? "text-brass" : "text-text-secondary"
                    }`}
                  >
                    {kind === "expense" ? "\u2212" : "+"}
                  </Text>
                  <Text
                    className={`text-[12.5px] font-manrope-semibold capitalize ${
                      active ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {kind}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-brass py-4 active:opacity-80"
            style={{ opacity: isSaving ? 0.6 : 1 }}
          >
            <Text className="text-center font-manrope-bold text-sm text-ink">
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
