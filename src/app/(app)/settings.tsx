import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as ScreenCapture from "expo-screen-capture";
import { storage } from "@/lib/storage";
import { Toggle } from "@/components/ui/Toggle";
import { DonateQRModal } from "@/components/modals/DonateQRModal";
import * as Application from "expo-application";
import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import { ChevronRightIcon } from "@/components/navigation/icons";
import type { ThemePreference } from "@/lib/storage";
import { useTheme, useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";

// ─── local primitives ────────────────────────────────────────────────────────

const THEME_OPTIONS: ThemePreference[] = ["light", "dark", "auto"];

function SegmentedThemeControl({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (v: ThemePreference) => void;
}) {
  const colors = useColors();
  return (
    <View
      className="flex-row rounded-[10px]  p-0.5"
      style={{
        backgroundColor: colors.surfaceElevated,
      }}
    >
      {THEME_OPTIONS.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className="rounded-lg px-[10px] py-[5px] active:opacity-80"
          style={{
            backgroundColor: option === value ? colors.brass : undefined,
          }}
        >
          <Text
            className="text-[11.5px] font-manrope-bold capitalize"
            style={{
              color: option === value ? colors.ink : colors.textSecondary,
            }}
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
    <Text
      className="mb-2 mt-[18px] font-mono text-[11.5px] uppercase tracking-[0.08em] "
      style={{
        color: colors.brass,
      }}
    >
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
    <View
      className="flex-row items-center border-b py-[13px]"
      style={{
        borderColor: colors.hairline,
      }}
    >
      <View className="mr-3 flex-1 flex-row items-center gap-3">
        <View
          className="h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] "
          style={{
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <Lucide name={icon} size={14} color={colors.brass} />
        </View>
        <View className="flex-1">
          <Text
            className="text-[14.5px] font-manrope-semibold "
            numberOfLines={1}
            style={{
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {description !== undefined && (
            <Text
              className="mt-[1px] text-[12px]"
              numberOfLines={2}
              style={{
                color: colors.textSecondary,
              }}
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
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [showDonate, setShowDonate] = useState(false);
  const colors = useColors();
  const toast = useToast();

  const { preference, loaded, setPreference } = useTheme();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [bio, screenshots, storedPin] = await Promise.all([
        storage.getBiometricEnabled(),
        storage.getScreenshotsEnabled(),
        storage.getPinHash(),
      ]);
      if (cancelled) return;
      setBiometricEnabled(bio);
      setScreenshotsEnabled(screenshots);
      setPinHash(storedPin);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── preference handlers ──────────────────────────────────────────────────────

  const handleBiometricToggle = async (value: boolean) => {
    // Disabling biometrics requires a backup PIN to avoid lockout
    if (!value) {
      const hash = await storage.getPinHash();
      if (!hash) {
        toast.warning("Backup PIN required", {
          description:
            "Set a 6-digit backup PIN first so you can still access Sloth if biometrics fail.",
        });
        router.push("/pin-setup");
        return; // keep toggle on
      }
    }
    setBiometricEnabled(value);
    await storage.setBiometricEnabled(value);
  };

  const handleScreenshotsToggle = async (value: boolean) => {
    setScreenshotsEnabled(value);
    await storage.setScreenshotsEnabled(value);
    if (value) {
      await ScreenCapture.allowScreenCaptureAsync();
    } else {
      await ScreenCapture.preventScreenCaptureAsync();
    }
  };

  const handleThemeChange = (newPreference: ThemePreference) => {
    setPreference(newPreference);
  };

  // ── navigation / action helpers ──────────────────────────────────────────────

  const comingSoon = (feature: string) => {
    toast.warning("Coming soon", {
      description: `${feature} will be available in a future update.`,
    });
  };

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <View
      className="flex-1 pt-safe"
      style={{
        backgroundColor: colors.surfaceBg,
      }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-[22px] flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Lucide name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text
            className="font-fraunces-medium text-[22px] "
            style={{ color: colors.textPrimary }}
          >
            Settings
          </Text>
        </View>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <SectionLabel label="Appearance" />
        <SettingsRow
          icon="palette"
          title="Theme"
          description={
            preference === "auto"
              ? "Auto — follows your device theme"
              : preference === "dark"
                ? "Dark theme active"
                : "Light theme active"
          }
          right={
            loaded ? (
              <SegmentedThemeControl
                value={preference}
                onChange={handleThemeChange}
              />
            ) : null
          }
        />

        {/* ── Security ────────────────────────────────────────────────────── */}
        <SectionLabel label="Security" />
        <SettingsRow
          icon="fingerprint"
          title="Face / Touch ID"
          description="Unlock Sloth with biometrics"
          right={
            <Toggle
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
            />
          }
        />
        <SettingsRow
          icon="key-round"
          title="Backup PIN"
          description={
            pinHash
              ? "Change or remove your backup PIN"
              : "Not set — add a backup PIN"
          }
          onPress={async () => {
            const hash = await storage.getPinHash();
            if (!hash) {
              router.push("/pin-setup");
            } else {
              router.push("/pin-setup");
              toast("Remove backup PIN?", {
                description:
                  "You won't be able to disable biometrics without a backup PIN.",
                action: {
                  label: "Remove",
                  onClick: async () => {
                    await storage.removePinHash();
                    setPinHash(null);
                    toast.success("Backup PIN removed");
                  },
                },
                duration: 6000,
              });
            }
          }}
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
            <Toggle
              value={screenshotsEnabled}
              onValueChange={handleScreenshotsToggle}
            />
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
