import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { storage, type ThemePreference } from "@/lib/storage";
import { Toggle } from "@/components/ui/Toggle";
import * as Application from "expo-application";

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
    <View className="flex-row rounded-[10px] bg-ink-3 p-0.5">
      {THEME_OPTIONS.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-lg px-2.5 py-1.5 active:opacity-80 ${
            option === value ? "bg-brass" : ""
          }`}
        >
          <Text
            className={`text-[10.5px] font-bold capitalize ${
              option === value ? "text-ink" : "text-parchment-dim"
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
    <Text className="mb-2 mt-5 font-mono text-[10.5px] uppercase tracking-[1.5px] text-brass">
      {label}
    </Text>
  );
}

function Chevron() {
  return (
    <Text className="text-sm text-parchment-dim" accessibilityElementsHidden>
      ›
    </Text>
  );
}

interface SettingsRowProps {
  icon: string;
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
  const content = (
    <View className="flex-row items-center border-b border-white/[0.09] py-3">
      {/* left: icon + label block */}
      <View className="mr-3 flex-1 flex-row items-center gap-3">
        <View className="h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-ink-3">
          <Text className="text-[13px] text-brass">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-[13.5px] font-bold text-parchment"
            numberOfLines={1}
          >
            {title}
          </Text>
          {description !== undefined && (
            <Text
              className="mt-0.5 text-[11px] text-parchment-dim"
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      {/* right: control */}
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
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>("auto");
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load all stored preferences in one parallel batch on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bio, screenshots, themeVal] = await Promise.all([
        storage.getBiometricEnabled(),
        storage.getScreenshotsEnabled(),
        storage.getThemePreference(),
      ]);
      if (cancelled) return;
      setBiometricEnabled(bio);
      setScreenshotsEnabled(screenshots);
      setTheme(themeVal);
      setPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── preference handlers ─────────────────────────────────────────────────────

  const handleBiometricToggle = async (value: boolean) => {
    setBiometricEnabled(value);
    await storage.setBiometricEnabled(value);
  };

  const handleScreenshotsToggle = async (value: boolean) => {
    setScreenshotsEnabled(value);
    await storage.setScreenshotsEnabled(value);
  };

  const handleThemeChange = async (value: ThemePreference) => {
    setTheme(value);
    await storage.setThemePreference(value);
  };

  // ── navigation / action helpers ─────────────────────────────────────────────

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Could not open link",
        "Check your internet connection and try again.",
        [{ text: "OK" }],
      ),
    );
  };

  const comingSoon = (feature: string) => {
    Alert.alert(
      "Coming soon",
      `${feature} will be available in a future update.`,
      [{ text: "OK" }],
    );
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-ink">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-1 font-serif text-[22px] text-parchment">
          Settings
        </Text>

        {/* ── Appearance ─────────────────────────────────────────────────── */}
        <SectionLabel label="Appearance" />
        <SettingsRow
          icon="◑"
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

        {/* ── Security ───────────────────────────────────────────────────── */}
        <SectionLabel label="Security" />
        <SettingsRow
          icon="◎"
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
          icon="#"
          title="Backup PIN"
          description="Fallback when biometrics fail"
          onPress={() => comingSoon("PIN management")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="▦"
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

        {/* ── Data ───────────────────────────────────────────────────────── */}
        <SectionLabel label="Data" />
        <SettingsRow
          icon="▤"
          title="Accounts"
          description="Manage your accounts"
          onPress={() => router.navigate("/(app)/accounts")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="◐"
          title="Categories"
          description="Manage expense types"
          onPress={() => comingSoon("Categories")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="↓"
          title="Export data"
          description="CSV or encrypted backup file"
          onPress={() => comingSoon("Data export")}
          right={<Chevron />}
        />

        {/* ── Support ────────────────────────────────────────────────────── */}
        <SectionLabel label="Support" />
        <SettingsRow
          icon="♥"
          title="Donate"
          description="Support development directly"
          onPress={() => comingSoon("Donations")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="✦"
          title="Request a feature"
          description="Opens an issue on GitHub"
          onPress={() =>
            openUrl(
              "https://github.com/MarJose123/sloth/issues/new?labels=enhancement",
            )
          }
          right={<Chevron />}
        />
        <SettingsRow
          icon="!"
          title="Report an error"
          description="Opens an issue on GitHub"
          onPress={() =>
            openUrl("https://github.com/MarJose123/sloth/issues/new?labels=bug")
          }
          right={<Chevron />}
        />

        {/* ── About ──────────────────────────────────────────────────────── */}
        <SectionLabel label="About" />
        <SettingsRow
          icon="🦥"
          title="About Sloth"
          description={`Version ${APP_VERSION} Build ${APP_BUILD_NUMBER} · license, source code`}
          onPress={() => comingSoon("About screen")}
          right={<Chevron />}
        />
        <SettingsRow
          icon="i"
          title="Privacy & security"
          description="How Sloth protects your data"
          onPress={() => comingSoon("Privacy screen")}
          right={<Chevron />}
        />

        {/* ── build stamp ── */}
        <Text className="mt-8 text-center font-mono text-[10.5px] text-parchment-dim">
          Sloth {APP_VERSION} · GPLv3
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
