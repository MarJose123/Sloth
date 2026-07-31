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

import { useCallback, useEffect, useRef, useState } from "react";
import * as Application from "expo-application";
import {
  checkForUpdate,
  downloadAPK,
  installAPK,
  UpdateInfo,
  clearUpdateCache,
} from "@/lib/updateService";

export interface UpdateCheckState {
  isChecking: boolean;
  isAvailable: boolean;
  updateInfo: UpdateInfo | null;
  error: string | null;
}

export interface DownloadProgress {
  bytesWritten: number;
  totalBytes: number;
  percentage: number;
}

export function useUpdateChecker() {
  const [state, setState] = useState<UpdateCheckState>({
    isChecking: false,
    isAvailable: false,
    updateInfo: null,
    error: null,
  });

  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadedApkUri, setDownloadedApkUri] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (state.isChecking) return;

    setState((prev) => ({ ...prev, isChecking: true, error: null }));
    abortControllerRef.current = new AbortController();

    try {
      const currentVersion = Application.nativeApplicationVersion ?? "1.0.0";
      const currentBuild = Application.nativeBuildVersion ?? "1";

      const result = await checkForUpdate(currentVersion, currentBuild);

      if (!abortControllerRef.current.signal.aborted) {
        if (result.available) {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            isAvailable: true,
            updateInfo: result.updateInfo,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            isAvailable: false,
          }));
        }
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setState((prev) => ({
          ...prev,
          isChecking: false,
          error: err instanceof Error ? err.message : "Unknown error occurred",
        }));
      }
    }
  }, [state.isChecking]);

  // Download APK
  const downloadUpdate = useCallback(async () => {
    if (!state.updateInfo || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(null);

    try {
      const apkUri = await downloadAPK(
        state.updateInfo.apkUrl,
        (bytesWritten, totalBytes) => {
          setDownloadProgress({
            bytesWritten,
            totalBytes,
            percentage: Math.round((bytesWritten / totalBytes) * 100),
          });
        },
      );

      if (apkUri) {
        setDownloadedApkUri(apkUri);
      } else {
        setState((prev) => ({
          ...prev,
          error: "Failed to download APK",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Download failed",
      }));
    } finally {
      setIsDownloading(false);
    }
  }, [state.updateInfo, isDownloading]);

  // Install APK
  const installUpdate = useCallback(async () => {
    if (!downloadedApkUri || isInstalling) return;

    setIsInstalling(true);

    try {
      const success = await installAPK(downloadedApkUri);
      if (!success) {
        setState((prev) => ({
          ...prev,
          error: "Failed to start APK installation",
        }));
      }
      // Note: App may restart after installation, so we don't need to handle the response
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Installation failed",
      }));
    } finally {
      setIsInstalling(false);
    }
  }, [downloadedApkUri, isInstalling]);

  // Reset state
  const reset = useCallback(async () => {
    await clearUpdateCache();
    setState({
      isChecking: false,
      isAvailable: false,
      updateInfo: null,
      error: null,
    });
    setDownloadProgress(null);
    setDownloadedApkUri(null);
    setIsDownloading(false);
    setIsInstalling(false);
  }, []);

  // Cancel operations
  const cancel = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    await reset();
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    downloadProgress,
    isDownloading,
    isInstalling,
    downloadedApkUri,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    reset,
    cancel,
  };
}
