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
  Modal,
  Pressable,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  ProgressBarAndroid,
  Platform,
} from "react-native";
import { useState } from "react";
import { UpdateInfo } from "@/lib/updateService";
import { useColors } from "@/theme/ThemeContext";

interface UpdateModalProps {
  isVisible: boolean;
  updateInfo: UpdateInfo | null;
  isDownloading?: boolean;
  isInstalling?: boolean;
  downloadProgress?: {
    bytesWritten: number;
    totalBytes: number;
    percentage: number;
  } | null;
  onDismiss: () => void;
  onDownload?: () => void;
  onInstall?: () => void;
}

export function UpdateModal({
  isVisible,
  updateInfo,
  isDownloading = false,
  isInstalling = false,
  downloadProgress = null,
  onDismiss,
  onDownload,
  onInstall,
}: UpdateModalProps) {
  const colors = useColors();
  const [showDetails, setShowDetails] = useState(false);

  if (!updateInfo) return null;

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const isLoading = isDownloading || isInstalling;

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <View
          className="w-5/6 max-w-sm overflow-hidden rounded-2xl"
          style={{ backgroundColor: colors.surfaceCard }}
        >
          <ScrollView
            className="max-h-96"
            contentContainerStyle={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={showDetails}
          >
            {/* Header */}
            <Text
              className="mb-2 text-center font-fraunces-medium text-xl"
              style={{ color: colors.textPrimary }}
            >
              Update Available
            </Text>
            <Text
              className="mb-6 text-center text-sm font-semibold"
              style={{ color: colors.brassText }}
            >
              Version {updateInfo.version} (Build {updateInfo.build})
            </Text>

            {/* Release Notes Preview */}
            {!showDetails && (
              <>
                <View
                  className="mb-4 rounded-lg p-3"
                  style={{ backgroundColor: colors.surfaceBg }}
                >
                  <Text
                    className="line-clamp-3 text-xs leading-relaxed"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={3}
                  >
                    {updateInfo.releaseNotes || "No release notes available"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setShowDetails(true)}
                  className="mb-4"
                >
                  <Text
                    className="text-center text-xs underline"
                    style={{ color: colors.brassText }}
                  >
                    Read full notes
                  </Text>
                </Pressable>
              </>
            )}

            {/* Full Release Notes */}
            {showDetails && (
              <View
                className="mb-4 rounded-lg p-3"
                style={{ backgroundColor: colors.surfaceBg }}
              >
                <Text
                  className="text-xs leading-relaxed"
                  style={{ color: colors.textSecondary }}
                >
                  {updateInfo.releaseNotes}
                </Text>
              </View>
            )}

            {/* File Size & Date */}
            <View className="mb-6 flex-row justify-between gap-4">
              <View className="flex-1">
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Size
                </Text>
                <Text
                  className="font-mono text-sm font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {formatFileSize(updateInfo.apkSize)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  Released
                </Text>
                <Text
                  className="font-mono text-sm font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  {new Date(updateInfo.publishedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Download Progress */}
            {isDownloading && downloadProgress && (
              <View className="mb-4">
                <View className="mb-2 flex-row justify-between">
                  <Text
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    Downloading ({downloadProgress.percentage}%)
                  </Text>
                  <Text
                    className="text-xs font-mono"
                    style={{ color: colors.textSecondary }}
                  >
                    {formatFileSize(downloadProgress.bytesWritten)} /{" "}
                    {formatFileSize(downloadProgress.totalBytes)}
                  </Text>
                </View>
                {Platform.OS === "android" ? (
                  <ProgressBarAndroid
                    styleAttr="Horizontal"
                    indeterminate={false}
                    progress={downloadProgress.percentage / 100}
                    color={colors.brass}
                  />
                ) : (
                  <View
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: colors.surfaceBg }}
                  >
                    <View
                      className="h-full"
                      style={{
                        width: `${downloadProgress.percentage}%`,
                        backgroundColor: colors.brass,
                      }}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Installing Status */}
            {isInstalling && (
              <View className="mb-6 flex-row items-center justify-center gap-3">
                <ActivityIndicator size="small" color={colors.brass} />
                <Text style={{ color: colors.textSecondary }}>
                  Installing update...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View
            className="flex-row gap-3 border-t px-6 py-4"
            style={{
              borderColor: colors.hairline,
            }}
          >
            <Pressable
              onPress={onDismiss}
              className="flex-1 rounded-lg border px-4 py-3"
              style={{
                borderColor: colors.hairline,
              }}
              disabled={isLoading}
            >
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: colors.textSecondary }}
              >
                Later
              </Text>
            </Pressable>

            <Pressable
              onPress={isDownloading ? undefined : onDownload || onInstall}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-lg px-4 py-3"
              style={{
                backgroundColor: isLoading
                  ? `${colors.brassButton}80`
                  : colors.brassButton,
              }}
              disabled={isLoading}
            >
              {isLoading && (
                <ActivityIndicator size="small" color={colors.buttonLabel} />
              )}
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: colors.buttonLabel }}
              >
                {isInstalling
                  ? "Installing..."
                  : isDownloading
                    ? "Downloading..."
                    : "Update Now"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
