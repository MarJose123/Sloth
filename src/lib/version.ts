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

/**
 * Parse semantic version string
 * Returns [major, minor, patch] or null if invalid
 */
export function parseVersion(
  versionString: string,
): [number, number, number] | null {
  const match = versionString.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
  ];
}

/**
 * Compare two semantic versions
 * Returns: -1 (v1 < v2), 0 (equal), 1 (v1 > v2)
 */
export function compareVersions(v1: string, v2: string): -1 | 0 | 1 {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (!parsed1 || !parsed2) {
    return 0; // Invalid versions are considered equal
  }

  const [maj1, min1, patch1] = parsed1;
  const [maj2, min2, patch2] = parsed2;

  if (maj1 !== maj2) return maj1 < maj2 ? -1 : 1;
  if (min1 !== min2) return min1 < min2 ? -1 : 1;
  if (patch1 !== patch2) return patch1 < patch2 ? -1 : 1;

  return 0;
}

/**
 * Check if an update is available
 * Considers: version (major.minor.patch) and build number
 */
export function isUpdateAvailable(
  currentVersion: string,
  currentBuild: string,
  latestVersion: string,
  latestBuild: string,
): boolean {
  const versionComparison = compareVersions(currentVersion, latestVersion);

  // Major/minor/patch update available
  if (versionComparison < 0) {
    return true;
  }

  // Same version, check build number (patch build)
  if (versionComparison === 0) {
    const currentBuildNum = parseInt(currentBuild, 10) || 0;
    const latestBuildNum = parseInt(latestBuild, 10) || 0;
    return latestBuildNum > currentBuildNum;
  }

  return false;
}

/**
 * Determine update type
 */
export type UpdateType = "major" | "minor" | "patch" | "build";

export function getUpdateType(
  currentVersion: string,
  latestVersion: string,
  currentBuild: string,
  latestBuild: string,
): UpdateType | null {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);

  if (!current || !latest) return null;

  const [maj1, min1, patch1] = current;
  const [maj2, min2, patch2] = latest;

  if (maj2 > maj1) return "major";
  if (min2 > min1) return "minor";
  if (patch2 > patch1) return "patch";

  const currentBuildNum = parseInt(currentBuild, 10) || 0;
  const latestBuildNum = parseInt(latestBuild, 10) || 0;
  if (latestBuildNum > currentBuildNum) return "build";

  return null;
}
