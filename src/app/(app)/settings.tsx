import type { ReactNode } from "react";
import { useCallback, useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { storage } from "@/lib/storage";
import { Toggle } from "@/components/ui/Toggle";
import { DonateQRModal } from "@/components/modals/DonateQRModal";
import * as Application from "expo-application";
import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import { ChevronRightIcon } from "@/components/navigation/icons";
import { useTheme, useColors } from "@/theme/ThemeContext";
import type { ThemePreference } from "@/lib/storage";

// ─── local primitives ────────────────────────────────────────────────────────

const THEME_OPTIONS = ["light", "dark", "auto"] as const;

function SegmentedThemeControl({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (v: ThemePreference) => void;
}) {
  return (
    <View className="flex-row rounded-[10px] bg-surface-elevated p-0.5">
      {THEME_OPTIONS.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-lg px-[10px] py-[5px] active:opacity-80 ${
            option === value ? "bg-brass" : ""
          }`}
        >
          <Text
            className={`text-[11.5px] font-manrope-bold capitalize ${
              option === value ? "text-ink" : "text-text-secondary"
            }`}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mb-2 mt-[18px] font-mono text-[11.5px] uppercase tracking-[0.08em] text-brass">
      {label}
    </Text>
  );
}

function Chevron() {
  const colors = useColors();
  return <ChevronRightIcon size={18} color={colors.textSecondary} />;
}

interface SettingsRowProps {
  icon: LucideIconName;
  title: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
}

function SettingsRow({
  icon,
  title,
  description,
  right,
  onPress,
}: SettingsRowProps) {
  const colors = useColors();
  const content = (
    <View className="flex-row items-center border-b border-hairline py-[13px]">
      <View className="mr-3 flex-1 flex-row items-center gap-3">
        <View className="h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-surface-elevated">
          <Lucide name={icon} size={14} color={colors.brass} />
        </View>
        <View className="flex-1">
          <Text
            className="text-[14.5px] font-manrope-semibold text-text-primary"
            numberOfLines={1}
          >
            {title}
          </Text>
          {description !== undefined && (
            <Text
              className="mt-[1px] text-[12px] text-text-secondary"
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );

  if (onPress !== undefined) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── screen ───────────────────────────────────────────────────────────────────

const APP_VERSION = Application.nativeApplicationVersion ?? "1.0.0";
const APP_BUILD_NUMBER = Application.nativeBuildVersion ?? "1";

export default function SettingsScreen() {
  const {
    preference: theme,
    setPreference: setTheme,
    loaded: prefsLoaded,
  } = useTheme();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bio, screenshots] = await Promise.all([
        storage.getBiometricEnabled(),
        storage.getScreenshotsEnabled(),
      ]);
      if (cancelled) return;
      setBiometricEnabled(bio);
      setScreenshotsEnabled(screenshots);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── preference handlers ──────────────────────────────────────────────────────

  const handleBiometricToggle = async (value: boolean) => {
    setBiometricEnabled(value);
    await storage.setBiometricEnabled(value);
  };

  const handleScreenshotsToggle = async (value: boolean) => {
    setScreenshotsEnabled(value);
    await storage.setScreenshotsEnabled(value);
  };

  const handleThemeChange = useCallback(
    async (value: ThemePreference) => {
      await setTheme(value);
    },
    [setTheme],
  );

  // ── navigation / action helpers ──────────────────────────────────────────────

  const comingSoon = (feature: string) => {
    Alert.alert(
      "Coming soon",
      `${feature} will be available in a future update.`,
      [{ text: "OK" }],
    );
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 pt-safe bg-surface-bg">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-[22px] font-fraunces-medium text-[22px] text-text-primary">
          Settings
        </Text>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <SectionLabel label="Appearance" />
        <SettingsRow
          icon="palette"
          title="Theme"
          description="Dark, light, or match device"
          right={
            prefsLoaded ? (
              <SegmentedThemeControl
                value={theme}
                onChange={handleThemeChange}
              />
            ) : undefined
          }
        />

        {/* ── Security ────────────────────────────────────────────────────── */}
        <SectionLabel label="Security" />
        <SettingsRow
          icon="fingerprint"
          title="Face / Touch ID"
          description="Unlock Sloth with biometrics"
          right={
            prefsLoaded ? (
              <Toggle
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
              />
            ) : undefined
          }
        />
        <SettingsRow
          icon="key-round"
          title="Backup PIN"
          description="Fallback when biometrics fail"
          onPress={() => comingSoon("PIN management")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="shield"
          title="Allow screenshots"
          description={
            screenshotsEnabled
              ? "On — screen visible in app switcher"
              : "Off — screen hidden in app switcher"
          }
          right={
            prefsLoaded ? (
              <Toggle
                value={screenshotsEnabled}
                onValueChange={handleScreenshotsToggle}
              />
            ) : undefined
          }
        />

        {/* ── Data ────────────────────────────────────────────────────────── */}
        <SectionLabel label="Data" />
        <SettingsRow
          icon="wallet"
          title="Accounts"
          description="Manage your accounts"
          onPress={() => router.navigate("/(app)/accounts")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="tags"
          title="Categories"
          description="Manage expense types"
          onPress={() => router.push("/(app)/categories")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="download"
          title="Export data"
          description="CSV or encrypted backup file"
          onPress={() => comingSoon("Data export")}
          right={<Chevron />}
        />

        {/* ── Support ─────────────────────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SettingsRow
          icon="heart"
          title="Donate"
          description="Support development directly"
          onPress={() => setShowDonate(true)}
          right={<Chevron />}
        />

        {/* ── About ───────────────────────────────────────────────────────── */}
        <SectionLabel label="About" />
        <SettingsRow
          icon="info"
          title="About Sloth"
          description={`Version ${APP_VERSION} · license, source code`}
          onPress={() => router.push("/about")}
          right={<Chevron />}
        />

        {/* ── Build stamp ── */}
        <Text className="mt-8 text-center font-mono text-[11.5px] text-text-secondary">
          Sloth {APP_VERSION} ({APP_BUILD_NUMBER}) · GPLv3
        </Text>
      </ScrollView>

      {/* ── Donate modal ── */}
      <DonateQRModal
        visible={showDonate}
        onClose={() => setShowDonate(false)}
      />
    </View>
  );
}
