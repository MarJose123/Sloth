import { useCallback, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  insertAccount,
  type AccountType,
} from "@/lib/db/repositories/accounts";
import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";

// ─── constants ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: {
  type: AccountType;
  label: string;
  icon: LucideIconName;
}[] = [
  { type: "checking", label: "Checking", icon: "landmark" },
  { type: "savings", label: "Savings", icon: "piggy-bank" },
  { type: "credit", label: "Credit card", icon: "credit-card" },
  { type: "cash", label: "Cash", icon: "banknote" },
];

const BADGE_COLORS = [
  colors.brass,
  colors.sage,
  colors.rust,
  colors.dustyBlue,
  colors.textSecondary,
] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0] ?? "").slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function parseBalanceCents(text: string): number {
  const stripped = text.replace(/[$,\s]/g, "");
  const val = parseFloat(stripped);
  return isNaN(val) ? 0 : Math.round(val * 100);
}

// ─── color swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <View
        className="border-brass"
        style={{
          padding: selected ? 3 : 0,
          borderRadius: 15,
          borderWidth: selected ? 2 : 0,
        }}
      >
        <View
          style={{
            width: selected ? 20 : 26,
            height: selected ? 20 : 26,
            borderRadius: selected ? 10 : 13,
            backgroundColor: color,
          }}
        />
      </View>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AddAccountScreen() {
  const colors = useColors();
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<AccountType>("checking");
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [balanceText, setBalanceText] = useState("0.00");
  const [isSaving, setIsSaving] = useState(false);

  const selectedColor = BADGE_COLORS[selectedColorIdx] ?? colors.brass;
  const initials = getInitials(name) || "·";

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Missing name", "Please enter an account name.");
      return;
    }

    setIsSaving(true);
    try {
      await insertAccount({
        name: trimmedName,
        type: selectedType,
        colorHex: selectedColor,
        startingBalanceCents: parseBalanceCents(balanceText),
      });
      router.back();
    } catch (err) {
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : "Something went wrong.",
        [{ text: "OK" }],
      );
    } finally {
      setIsSaving(false);
    }
  }, [name, selectedType, selectedColor, balanceText]);

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
          <View className="mb-8 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="active:opacity-60"
            >
              <Text className="text-[14.5px] text-text-secondary">Cancel</Text>
            </Pressable>
            <Text className="font-fraunces-medium text-[20px] text-text-primary">
              New account
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

          {/* ── Account name ── */}
          <View className="mb-5 rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
              Account name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Chase Checking"
              placeholderTextColor={colors.textSecondary}
              className="text-sm text-text-primary"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* ── Type selector ── */}
          <Text className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
            Type
          </Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map(({ type, label, icon }) => {
              const active = selectedType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`flex-1 basis-[45%] flex-col gap-2 rounded-[13px] border p-3.5 active:opacity-80 ${
                    active
                      ? "border-brass/50 bg-brass/10"
                      : "border-hairline bg-surface-card"
                  }`}
                >
                  <Lucide
                    name={icon}
                    size={20}
                    color={active ? colors.brass : colors.textSecondary}
                  />
                  <Text
                    className={`text-[12.5px] font-manrope-semibold ${
                      active ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Badge preview + color picker ── */}
          <Text className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em] text-brass">
            Badge color
          </Text>

          {/* Preview */}
          <View className="mb-4 items-center">
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: selectedColor }}
            >
              <Text className="font-mono-medium text-base text-ink">
                {initials}
              </Text>
            </View>
          </View>

          {/* Swatches */}
          <View className="mb-5 flex-row gap-3">
            {BADGE_COLORS.map((color, idx) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={selectedColorIdx === idx}
                onPress={() => setSelectedColorIdx(idx)}
              />
            ))}
          </View>

          {/* ── Starting balance ── */}
          <View className="mb-8 rounded-2xl border border-hairline bg-surface-card px-4 py-3.5">
            <Text className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-text-secondary">
              Starting balance
            </Text>
            <TextInput
              value={balanceText}
              onChangeText={setBalanceText}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              className="font-fraunces-medium text-[20px] text-text-primary"
              returnKeyType="done"
            />
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="rounded-2xl bg-brass py-4 active:opacity-80"
            style={{ opacity: isSaving ? 0.6 : 1 }}
          >
            <Text className="text-center font-manrope-bold text-sm text-ink">
              {isSaving ? "Adding…" : "Add account"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
