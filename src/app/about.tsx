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

import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { SlothAppIcon } from "@/components/SlothAppIcon";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import { UpdateModal } from "@/components/UpdateModal";

// ─── constants ────────────────────────────────────────────────────────────────

const APP_VERSION = Application.nativeApplicationVersion ?? "1.0.0";
const APP_BUILD_NUMBER = Application.nativeBuildVersion ?? "1";

// Device fingerprint prefilled into the bug-report form (entry.962252763).
// e.g. "Google Pixel 7 · Android 15"
const DEVICE_INFO = [
  [Device.brand, Device.modelName]
    .filter((part): part is string => Boolean(part))
    .join(" "),
  [Device.osName, Device.osVersion]
    .filter((part): part is string => Boolean(part))
    .join(" "),
]
  .filter((part) => part.length > 0)
  .join(" · ");

const GITHUB_BASE = "https://github.com/MarJose123/sloth";
const ReportIssueUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSfuk7nxLy2gOryqhRZMfWTt5TsDlgaqjXNqTKCeXJsv7tazPA/viewform";
const RequestFeatureUrl = "https://forms.gle/nVKPj66PTff8DgwG7";

// Prefilled bug-report form URL. `URLSearchParams` handles the
// percent-encoding of device info (spaces, "·" separator, etc.).
const buildReportIssueUrl = (): string => {
  const url = new URL(ReportIssueUrl);
  url.searchParams.set("entry.656768655", APP_VERSION);
  url.searchParams.set("entry.962252763", DEVICE_INFO);
  return url.toString();
};

// ─── row components ───────────────────────────────────────────────────────────

interface AboutRowProps {
  title: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  isLoading?: boolean;
}

function AboutRow({
  title,
  value,
  right,
  onPress,
  isLoading = false,
}: AboutRowProps) {
  const colors = useColors();

  const content = (
    <View
      className="flex-row items-center justify-between border-t py-[13px]"
      style={{
        borderColor: colors.hairline,
      }}
    >
      <Text
        className="flex-1 text-[14.5px] font-manrope-semibold"
        style={{
          color: colors.textPrimary,
        }}
      >
        {title}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.brass} />
      ) : right !== undefined ? (
        right
      ) : value !== undefined ? (
        <Text
          className="font-mono text-[13px]"
          style={{
            color: colors.textSecondary,
          }}
        >
          {value}
        </Text>
      ) : (
        <ChevronRightIcon size={18} color={colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="active:opacity-70"
        disabled={isLoading}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const colors = useColors();
  const updateChecker = useUpdateChecker();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      /* silent — link errors are non-critical */
    });
  };

  const handleCheckForUpdates = async () => {
    await updateChecker.checkForUpdates();
  };

  // Latest-version badge — shown inline on the "Check for updates" row
  // whenever there is no error, no pending download and no newer release.
  const isUpToDate =
    !updateChecker.isChecking &&
    !updateChecker.isAvailable &&
    !updateChecker.error &&
    !updateChecker.isDownloading;

  // Show modal when update is available
  useFocusEffect(
    useCallback(() => {
      if (updateChecker.isAvailable && updateChecker.updateInfo) {
        setShowUpdateModal(true);
      }
    }, [updateChecker.isAvailable, updateChecker.updateInfo]),
  );

  return (
    <View
      className="flex-1 pt-safe"
      style={{
        backgroundColor: colors.surfaceBg,
      }}
    >
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)}>
          {/* ── Header ── */}
          <View className="mb-7 flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={20}
              className="active:opacity-60"
            >
              <ArrowLeftIcon size={28} color={colors.textSecondary} />
            </Pressable>
            <Text
              className="font-fraunces-medium text-[20px]"
              style={{
                color: colors.textPrimary,
              }}
            >
              About
            </Text>
          </View>
        </Animated.View>

        {/* ── Brand section ── */}
        <View className="mb-7 items-center">
          <SlothAppIcon size={64} />
          <Text
            className="mt-3 font-fraunces-medium text-[22px]"
            style={{
              color: colors.textPrimary,
            }}
          >
            Sloth
          </Text>
          <Text
            className="mt-1 font-mono text-[12px]"
            style={{
              color: colors.textSecondary,
            }}
          >
            Version {APP_VERSION} (Build {APP_BUILD_NUMBER})
          </Text>
        </View>

        {/* ── Description ── */}
        <Text
          className="mb-7 text-center text-sm leading-[19px]"
          style={{
            color: colors.textSecondary,
          }}
        >
          A private, fully offline finance tracker. No cloud, no sync, no
          accounts to create anywhere but here.
        </Text>

        {/* ── Status Messages ── */}
        {updateChecker.error && (
          <View
            className="mb-5 rounded-lg border p-3"
            style={{
              borderColor: colors.rust,
              backgroundColor: `${colors.rust}15`,
            }}
          >
            <Text className="text-xs" style={{ color: colors.rust }}>
              ⚠ {updateChecker.error}
            </Text>
          </View>
        )}

        {/* ── About Rows ── */}
        <AboutRow
          title="Check for updates"
          onPress={handleCheckForUpdates}
          isLoading={updateChecker.isChecking}
          right={
            isUpToDate ? (
              <View
                className="rounded-full border px-2.5 py-[3px]"
                style={{
                  borderColor: colors.sage,
                  backgroundColor: `${colors.sage}15`,
                }}
              >
                <Text
                  className="font-mono text-[11px]"
                  style={{ color: colors.sage }}
                >
                  {"✓ Up to date"}
                </Text>
              </View>
            ) : undefined
          }
        />
        <AboutRow title="License" value="GPLv3" />
        <AboutRow title="Source code" onPress={() => openUrl(GITHUB_BASE)} />
        <AboutRow
          title="Request a feature"
          onPress={() => openUrl(RequestFeatureUrl)}
        />
        <AboutRow
          title="Report an error"
          onPress={() => openUrl(buildReportIssueUrl())}
        />
        <AboutRow
          title="Acknowledgments"
          onPress={() => openUrl(`${GITHUB_BASE}/blob/main/CONTRIBUTING.md`)}
        />

        {/* ── Footer ── */}
        <Text
          className="mt-8 text-center font-mono text-[12px]"
          style={{
            color: colors.textSecondary,
          }}
        >
          Made slowly, on purpose.
        </Text>
      </ScrollView>

      {/* ── Update Modal ── */}
      <UpdateModal
        isVisible={showUpdateModal}
        updateInfo={updateChecker.updateInfo}
        isDownloading={updateChecker.isDownloading}
        isInstalling={updateChecker.isInstalling}
        downloadProgress={updateChecker.downloadProgress}
        onDismiss={() => {
          setShowUpdateModal(false);
        }}
        onDownload={() => {
          updateChecker.downloadUpdate();
        }}
        onInstall={() => {
          if (updateChecker.downloadedApkUri) {
            updateChecker.installUpdate();
          }
        }}
      />
    </View>
  );
}
