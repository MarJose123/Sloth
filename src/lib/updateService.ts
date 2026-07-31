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

import { Directory, DownloadTask, File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { isUpdateAvailable } from "./version";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  body: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
  published_at: string;
}

export interface UpdateInfo {
  version: string;
  build: string;
  releaseNotes: string;
  apkUrl: string;
  apkSize: number;
  publishedAt: string;
}

const GITHUB_OWNER = "MarJose123";
const GITHUB_REPO = "sloth";
const GITHUB_API_BASE = "https://api.github.com";
const APK_FILE_NAME = "sloth-update.apk";

/**
 * Fetch latest GitHub release
 * Returns null if fetch fails or no release found
 */
export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      console.warn(`GitHub API returned ${response.status}`);
      return null;
    }

    const release: GitHubRelease = await response.json();

    // Skip drafts and pre-releases
    if (release.draft || release.prerelease) {
      return null;
    }

    return release;
  } catch (error) {
    console.error("Failed to fetch GitHub release:", error);
    return null;
  }
}

/**
 * Extract version from git tag (v1.0.0 → 1.0.0)
 */
function extractVersionFromTag(tag: string): string {
  return tag.replace(/^v/, "");
}

/**
 * Extract build number from release metadata
 * GitHub Actions should include build number in release body or use tag metadata
 * For now, we'll use the commit count or a simple incrementing scheme
 */
function extractBuildNumber(release: GitHubRelease): string {
  // Try to extract from release body first (if added by workflow)
  const buildMatch = release.body.match(/Build:\s*(\d+)/i);
  if (buildMatch) {
    return buildMatch[1];
  }
  // Fallback: Use tag index or default to "1"
  return "1";
}

/**
 * Find APK asset in release
 */
function findApkAsset(
  assets: GitHubRelease["assets"],
): GitHubRelease["assets"][0] | null {
  return assets.find((asset) => asset.name.endsWith(".apk")) || null;
}

/**
 * Parse release to UpdateInfo
 */
export function parseReleaseToUpdateInfo(
  release: GitHubRelease,
): UpdateInfo | null {
  const version = extractVersionFromTag(release.tag_name);
  const apkAsset = findApkAsset(release.assets);

  if (!apkAsset) {
    console.warn("No APK found in release assets");
    return null;
  }

  const build = extractBuildNumber(release);

  return {
    version,
    build,
    releaseNotes: release.body || "No release notes available",
    apkUrl: apkAsset.browser_download_url,
    apkSize: apkAsset.size,
    publishedAt: release.published_at,
  };
}

/**
 * Main function: Check if update is available
 * Compares current version/build with latest release
 */
export async function checkForUpdate(
  currentVersion: string,
  currentBuild: string,
): Promise<{ available: false } | { available: true; updateInfo: UpdateInfo }> {
  const release = await fetchLatestRelease();
  if (!release) {
    return { available: false };
  }

  const updateInfo = parseReleaseToUpdateInfo(release);
  if (!updateInfo) {
    return { available: false };
  }

  const hasUpdate = isUpdateAvailable(
    currentVersion,
    currentBuild,
    updateInfo.version,
    updateInfo.build,
  );

  if (!hasUpdate) {
    return { available: false };
  }

  return { available: true, updateInfo };
}

/**
 * Get download directory (app cache directory)
 * On Android: /data/data/app.package/cache/
 * On iOS: App cache folder
 */
function getDownloadDirectory(): Directory {
  return Paths.cache;
}

/**
 * Download APK to cache directory
 * Returns file URI on success, null on failure
 */
export async function downloadAPK(
  apkUrl: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<string | null> {
  try {
    const downloadDir = getDownloadDirectory();
    const file = new File(downloadDir, APK_FILE_NAME);

    // Remove old APK if exists
    try {
      if (file.exists) {
        file.delete();
      }
    } catch (_error) {
      // Ignore cleanup errors
    }

    console.log(`Starting APK download from: ${apkUrl}`);

    // Download with progress tracking
    const downloadTask = new DownloadTask(apkUrl, file, {
      onProgress: (progress) => {
        onProgress?.(progress.bytesWritten, progress.totalBytes);
      },
    });
    const downloadedFile = await downloadTask.downloadAsync();

    if (!downloadedFile) {
      console.error("Download returned empty result");
      return null;
    }

    console.log(`APK downloaded to: ${downloadedFile.uri}`);
    return downloadedFile.uri;
  } catch (error) {
    console.error("Failed to download APK:", error);
    return null;
  }
}

/**
 * Get APK file size
 */
export async function getDownloadedAPKSize(
  fileUri: string,
): Promise<number | null> {
  try {
    const file = new File(fileUri);
    if (!file.exists) {
      return null;
    }
    return file.size;
  } catch (error) {
    console.error("Failed to get APK info:", error);
    return null;
  }
}

/**
 * Delete cached APK
 */
export async function deleteDownloadedAPK(fileUri: string): Promise<boolean> {
  try {
    const file = new File(fileUri);
    if (file.exists) {
      file.delete();
      console.log(`Deleted APK: ${fileUri}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to delete APK:", error);
    return false;
  }
}

/**
 * Install APK using Android Package Manager
 * Works with eas build --local generated APKs
 */
export async function installAPK(fileUri: string): Promise<boolean> {
  if (Platform.OS !== "android") {
    console.warn("APK installation only available on Android");
    return false;
  }

  try {
    // Open the package installer activity with the APK file
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: fileUri,
      type: "application/vnd.android.package-archive",
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });

    console.log("APK installation initiated");
    return true;
  } catch (error) {
    console.error("Failed to start APK installation:", error);
    return false;
  }
}

/**
 * Get APK file info for verification
 */
export async function getAPKInfo(fileUri: string): Promise<{
  exists: boolean;
  size: number | null;
  mtime: number | null;
} | null> {
  try {
    const file = new File(fileUri);
    if (!file.exists) {
      return { exists: false, size: null, mtime: null };
    }
    return {
      exists: true,
      size: file.size,
      mtime: file.lastModified,
    };
  } catch (error) {
    console.error("Failed to get APK file info:", error);
    return null;
  }
}

/**
 * Clear all cached updates
 */
export async function clearUpdateCache(): Promise<boolean> {
  try {
    const downloadDir = getDownloadDirectory();
    const apkFile = new File(downloadDir, APK_FILE_NAME);
    await deleteDownloadedAPK(apkFile.uri);
    return true;
  } catch (error) {
    console.error("Failed to clear update cache:", error);
    return false;
  }
}
