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

import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Sloth's config extends ExpoConfig with the legacy `androidBuildNumber` key,
 * which the release workflow writes and commits. It is not part of the Expo
 * schema, so it is declared here to stay type-safe.
 */
type SlothExpoConfig = ExpoConfig & { androidBuildNumber: number };
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";
const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "marjose.sloth.app.dev";
  }

  if (IS_PREVIEW) {
    return "marjose.sloth.app.preview";
  }

  return "marjose.sloth.app.com";
};

const getAppName = () => {
  if (IS_DEV) {
    return "Sloth (Dev)";
  }

  if (IS_PREVIEW) {
    return "Sloth (Preview)";
  }

  return "Sloth: Finance Tracker";
};

export default ({ config }: ConfigContext): SlothExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "sloth",
  version: "1.0.0",
  icon: "./assets/icons/icon.png",
  scheme: "sloth",
  userInterfaceStyle: "automatic",
  githubUrl: "https://github.com/MarJose123/Sloth",
  orientation: "portrait",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    "@react-native-vector-icons/lucide",
    [
      "expo-local-authentication",
      {
        faceIDPermission: "Sloth uses Face ID to unlock your data locally.",
      },
    ],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#1B1F1A",
        image: "./assets/icons/adaptive-icon-foreground.png",
        imageWidth: 140,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission: "Sloth uses your camera to scan QR codes.",
        barcodeScannerEnabled: true,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "36.0.0",
          minSdkVersion: 31,
        },
      },
    ],
    "expo-status-bar",
    "expo-image",
    "expo-web-browser",
    [
      "expo-media-library",
      {
        photosPermission:
          "Sloth saves donation QR codes to your photo library.",
        savePhotosPermission:
          "Sloth saves donation QR codes to your photo library.",
      },
    ],
    "expo-widgets",
    "expo-mlkit-ocr",
  ],
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
    versionCode: 142,
    permissions: [
      "USE_BIOMETRIC",
      "USE_FINGERPRINT",
      "android.permission.USE_BIOMETRIC",
      "android.permission.USE_FINGERPRINT",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/icons/adaptive-icon-foreground.png",
      monochromeImage: "./assets/icons/adaptive-icon-monochrome.png",
      backgroundColor: "#1B1F1A",
    },
  },
  ios: {
    bundleIdentifier: getUniqueIdentifier(),
    icon: "./assets/icons/icon.png",
  },
  extra: {
    router: {},
    eas: {
      projectId: "bb35ddc3-4946-4972-b72a-f292d8570d81",
    },
  },
  platforms: ["ios", "android"],
  androidBuildNumber: 142,
});
