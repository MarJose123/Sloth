import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import {
  documentDirectory,
  makeDirectoryAsync,
  copyAsync,
} from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  insertAccount,
  type AccountType,
} from "@/lib/db/repositories/accounts";
import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import { BANK_LOGOS } from "@/lib/logoResolver";
import Color from "color";

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

const BADGE_MODES: {
  key: "color" | "logo" | "custom";
  label: string;
  icon: LucideIconName;
}[] = [
  { key: "color", label: "Color", icon: "swatch-book" },
  { key: "logo", label: "Logo", icon: "building" },
  { key: "custom", label: "Custom", icon: "upload" },
];

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

// ─── logo grid item ───────────────────────────────────────────────────────────

function LogoGridItem({
  source,
  name,
  selected,
  onPress,
}: {
  source: ReturnType<typeof require>;
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-70"
      style={{ width: "30%" }}
    >
      <View
        className="items-center justify-center rounded-[13px] border p-3"
        style={{
          borderColor: selected ? colors.brass : c.hairline,
          backgroundColor: selected
            ? Color(colors.brass).alpha(0.1).toString()
            : c.surfaceCard,
          borderWidth: selected ? 2 : 1,
        }}
      >
        <Image
          source={source}
          style={{ width: 48, height: 48, resizeMode: "contain" }}
        />
        <Text
          className="mt-1 text-[10px] font-manrope-medium text-center"
          style={{ color: c.textSecondary }}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AddAccountScreen() {
  const c = useColors();
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<AccountType>("checking");
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [balanceText, setBalanceText] = useState("0.00");
  const [isSaving, setIsSaving] = useState(false);

  // Badge mode state
  const [badgeMode, setBadgeMode] = useState<"color" | "logo" | "custom">(
    "color",
  );
  const [selectedLogoKey, setSelectedLogoKey] = useState<string | null>(null);
  const [customLogoUri, setCustomLogoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedColor = BADGE_COLORS[selectedColorIdx] ?? colors.brass;
  const initials = getInitials(name) || "·";

  // Resolve the final logoKey to save
  let resolvedLogoKey: string | null = null;
  let previewSource: ReturnType<typeof require> | { uri: string } | null = null;

  if (badgeMode === "logo" && selectedLogoKey) {
    resolvedLogoKey = selectedLogoKey;
    const found = BANK_LOGOS.find((l) => l.key === selectedLogoKey);
    if (found) previewSource = found.source;
  } else if (badgeMode === "custom" && customLogoUri) {
    resolvedLogoKey = `custom/${customLogoUri.split("/").pop()}`;
    previewSource = { uri: customLogoUri };
  }

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
        logoKey: resolvedLogoKey,
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
  }, [name, selectedType, selectedColor, resolvedLogoKey, balanceText]);

  // ── Custom image picker ──────────────────────────────────────────────────

  const handlePickImage = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setIsProcessing(true);

      // Resize to a max dimension suitable for badge display
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize({ width: 400 });
      const imageRef = await context.renderAsync();
      const manipResult = await imageRef.saveAsync({
        format: SaveFormat.PNG,
        compress: 0.9,
      });

      // Copy the processed image to persistent storage
      const destDir = `${documentDirectory}account-logos/`;
      await makeDirectoryAsync(destDir, { intermediates: true });
      const dest = `${destDir}${Date.now()}.png`;
      await copyAsync({ from: manipResult.uri, to: dest });

      setCustomLogoUri(dest);
      setBadgeMode("custom");
      setSelectedLogoKey(null);
    } catch {
      Alert.alert("Error", "Could not process the image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /** Crop the uploaded image to a square (center-crop) at 400×400. */
  const handleCropToSquare = useCallback(async () => {
    if (!customLogoUri) return;
    setIsProcessing(true);
    try {
      const context = ImageManipulator.manipulate(customLogoUri);
      context.resize({ width: 400, height: 400 });
      const imageRef = await context.renderAsync();
      const manipResult = await imageRef.saveAsync({
        format: SaveFormat.PNG,
        compress: 0.9,
      });

      // Overwrite the stored copy with the cropped version
      const destDir = `${documentDirectory}account-logos/`;
      await makeDirectoryAsync(destDir, { intermediates: true });
      const dest = `${destDir}${Date.now()}-cropped.png`;
      await copyAsync({ from: manipResult.uri, to: dest });

      setCustomLogoUri(dest);
    } catch {
      Alert.alert("Error", "Could not crop the image.");
    } finally {
      setIsProcessing(false);
    }
  }, [customLogoUri]);

  // Reset logo selection when switching away from logo or custom mode
  const handleBadgeModeChange = (mode: "color" | "logo" | "custom") => {
    setBadgeMode(mode);
    if (mode !== "logo") setSelectedLogoKey(null);
    if (mode !== "custom") setCustomLogoUri(null);
  };

  return (
    <View className="flex-1 pt-safe " style={{ backgroundColor: c.surfaceBg }}>
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
              <Text
                className="text-[14.5px]"
                style={{ color: c.textSecondary }}
              >
                Cancel
              </Text>
            </Pressable>
            <Text
              className="font-fraunces-medium text-[20px]"
              style={{ color: c.textPrimary }}
            >
              New account
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="active:opacity-60"
            >
              <Text
                className="font-manrope-bold text-[13px]"
                style={{ opacity: isSaving ? 0.4 : 1, color: colors.brass }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* ── Account name ── */}
          <View
            className="mb-5 rounded-2xl border px-4 py-3.5"
            style={{ backgroundColor: c.surfaceCard, borderColor: c.hairline }}
          >
            <Text
              className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: c.textSecondary }}
            >
              Account name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. BPI Savings"
              placeholderTextColor={c.textSecondary}
              className="text-sm"
              autoCapitalize="words"
              returnKeyType="next"
              style={{ color: c.textPrimary }}
            />
          </View>

          {/* ── Type selector ── */}
          <Text
            className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em]"
            style={{ color: colors.brass }}
          >
            Type
          </Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map(({ type, label, icon }) => {
              const active = selectedType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className="flex-1 basis-[45%] flex-col gap-2 rounded-[13px] border p-3.5 active:opacity-80"
                  style={{
                    borderColor: active
                      ? Color(colors.brass).alpha(0.5).toString()
                      : c.hairline,
                    backgroundColor: active
                      ? Color(colors.brass).alpha(0.1).toString()
                      : c.surfaceCard,
                  }}
                >
                  <Lucide
                    name={icon}
                    size={20}
                    color={active ? colors.brass : c.textSecondary}
                  />
                  <Text
                    className="text-[12.5px] font-manrope-semibold"
                    style={{ color: active ? c.textPrimary : c.textSecondary }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Badge ── */}
          <Text
            className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.08em]"
            style={{ color: colors.brass }}
          >
            Badge
          </Text>

          {/* Preview */}
          <View className="mb-4 items-center">
            <View
              className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
              style={{ backgroundColor: selectedColor }}
            >
              {previewSource ? (
                <Image
                  source={previewSource}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              ) : (
                <Text
                  className="font-mono-medium text-base"
                  style={{ color: colors.ink }}
                >
                  {initials}
                </Text>
              )}
            </View>
          </View>

          {/* ── Mode pills ── */}
          <View
            className="mb-4 flex-row rounded-[10px] p-0.5"
            style={{ backgroundColor: c.surfaceElevated }}
          >
            {BADGE_MODES.map((mode) => {
              const active = badgeMode === mode.key;
              return (
                <Pressable
                  key={mode.key}
                  onPress={() => handleBadgeModeChange(mode.key)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-2 active:opacity-80"
                  style={{ backgroundColor: active ? colors.brass : undefined }}
                >
                  <Lucide
                    name={mode.icon}
                    size={14}
                    color={active ? colors.ink : c.textSecondary}
                  />
                  <Text
                    className="text-[11px] font-manrope-bold"
                    style={{ color: active ? colors.ink : c.textSecondary }}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Mode content ── */}
          {badgeMode === "color" && (
            <View className="mb-5 flex-row gap-3">
              {BADGE_COLORS.map((clr, idx) => (
                <ColorSwatch
                  key={clr}
                  color={clr}
                  selected={selectedColorIdx === idx}
                  onPress={() => setSelectedColorIdx(idx)}
                />
              ))}
            </View>
          )}

          {badgeMode === "logo" && (
            <View className="mb-5 flex-row flex-wrap gap-2">
              {BANK_LOGOS.map((logo) => (
                <LogoGridItem
                  key={logo.key}
                  source={logo.source}
                  name={logo.name}
                  selected={selectedLogoKey === logo.key}
                  onPress={() => setSelectedLogoKey(logo.key)}
                />
              ))}
            </View>
          )}

          {badgeMode === "custom" && (
            <View className="mb-5 items-center">
              {isProcessing ? (
                <View className="items-center gap-3 py-8">
                  <Text
                    className="text-[13px] font-manrope-semibold"
                    style={{ color: c.textSecondary }}
                  >
                    Processing image…
                  </Text>
                </View>
              ) : customLogoUri ? (
                <View className="items-center gap-3">
                  <View
                    className="h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl"
                    style={{ backgroundColor: selectedColor }}
                  >
                    <Image
                      source={{ uri: customLogoUri }}
                      style={{ width: 100, height: 100 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={handleCropToSquare}
                      className="rounded-lg bg-surface-elevated px-4 py-2 active:opacity-70"
                    >
                      <Text
                        className="text-[12px] font-manrope-semibold"
                        style={{ color: colors.brass }}
                      >
                        Crop to square
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePickImage}
                      className="rounded-lg bg-surface-elevated px-4 py-2 active:opacity-70"
                    >
                      <Text
                        className="text-[12px] font-manrope-semibold"
                        style={{ color: colors.brass }}
                      >
                        Change image
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={handlePickImage}
                  className="w-full items-center gap-2 rounded-2xl border-2 border-dashed py-8 active:opacity-70"
                  style={{ borderColor: c.hairline }}
                >
                  <Lucide name="image-plus" size={32} color={c.textSecondary} />
                  <Text
                    className="text-[13px] font-manrope-semibold"
                    style={{ color: c.textSecondary }}
                  >
                    Tap to upload an image
                  </Text>
                  <Text
                    className="text-[11px] font-manrope"
                    style={{ color: c.textSecondary }}
                  >
                    PNG, JPG, WEBP
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* ── Starting balance ── */}
          <View
            className="mb-8 rounded-2xl border px-4 py-3.5"
            style={{ borderColor: c.hairline, backgroundColor: c.surfaceCard }}
          >
            <Text
              className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: c.textSecondary }}
            >
              Starting balance
            </Text>
            <TextInput
              value={balanceText}
              onChangeText={setBalanceText}
              placeholder="0.00"
              placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              className="font-fraunces-medium text-[20px]"
              returnKeyType="done"
              style={{ color: c.textPrimary }}
            />
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="rounded-2xl py-4 active:opacity-80"
            style={{
              opacity: isSaving ? 0.6 : 1,
              backgroundColor: colors.brass,
            }}
          >
            <Text
              className="text-center font-manrope-bold text-sm"
              style={{ color: colors.ink }}
            >
              {isSaving ? "Adding…" : "Add account"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
