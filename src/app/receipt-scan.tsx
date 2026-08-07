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
 * Receipt scan screen — Screen 13.
 *
 * Uses `expo-camera` for still-image capture and `@/lib/ocr` for on-device
 * receipt parsing via ML Kit. Detected fields can be confirmed to pre-fill
 * the Add Transaction form.
 *
 * Ref: Sloth app mockup.html Screen 13.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { BlurView } from "expo-blur";
import { Lucide } from "@react-native-vector-icons/lucide";
import { ReceiptScanResult } from "@/components/ReceiptScanResult";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import { useToast } from "@/hooks/useToast";
import { extractReceiptData, isOcrAvailable } from "@/lib/ocr";
import type { OcrResult } from "@/types";

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ReceiptScanScreen() {
  const c = useColors();
  const toast = useToast();
  const { height: screenHeight } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single source of truth for the scan frame + scrim geometry so the
  // frosted area always lines up with the dashed frame.
  const frame = {
    top: 100,
    left: 25,
    right: 25,
    height: Math.round(screenHeight * 0.76),
  };

  // Request camera permission on mount
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // ── Capture + OCR ─────────────────────────────────────────────────────────

  const handleShutter = useCallback(async () => {
    if (isProcessing || !cameraRef.current) return;

    // Check OCR availability
    if (!isOcrAvailable()) {
      setError("OCR is not available on this device");
      toast.error("OCR Unavailable", {
        description: "Receipt scanning is not supported on this device.",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error("Camera returned no image");
      }

      const ocrResult = await extractReceiptData(photo.uri);
      setResult(ocrResult);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to process receipt";
      setError(message);
      toast.error("Scan Error", {
        description: message,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, toast]);

  // ── Confirm → pre-fill Add Transaction ──────────────────────────────────

  const handleConfirm = useCallback(() => {
    if (!result) return;

    router.replace({
      pathname: "/add-transaction",
      params: {
        merchant: result.merchant ?? "",
        amountCents: result.amountCents?.toString() ?? "",
        date: result.date ?? "",
        source: "scan",
      },
    });
  }, [result]);

  // ── Scan again (retake) ──────────────────────────────────────────────────

  const handleRetake = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // ── Result view (replaces the camera) ────────────────────────────────────

  if (result && !isProcessing) {
    return (
      <ReceiptScanResult
        result={result}
        onClose={() => router.back()}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
      />
    );
  }

  // ── Permission loading ───────────────────────────────────────────────────

  if (!permission) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: c.surfaceBg }}
      >
        <Text
          className="text-sm font-manrope"
          style={{ color: c.textSecondary }}
        >
          {"Requesting camera permission\u2026"}
        </Text>
      </View>
    );
  }

  // ── Permission denied ────────────────────────────────────────────────────

  if (!permission.granted) {
    return (
      <View
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: c.surfaceBg }}
      >
        <Text
          className="mb-5 text-center text-sm leading-[1.55]"
          style={{
            color: c.textPrimary,
            fontFamily: "Manrope_400Regular",
          }}
        >
          Sloth needs camera access to scan receipts.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="rounded-2xl px-5 py-3 active:opacity-80"
          style={{ backgroundColor: c.brassButton }}
        >
          <Text
            className="text-sm font-manrope-bold"
            style={{ color: c.buttonLabel }}
          >
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <View className="flex-1" style={{ backgroundColor: c.surfaceBg }}>
      {/* ── Camera viewport ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      {/* ── Processing overlay ── */}
      {isProcessing && (
        <View style={styles.overlay}>
          <View
            className="items-center rounded-2xl px-8 py-6"
            style={{ backgroundColor: c.surfaceCard }}
          >
            <ActivityIndicator size="large" color={colors.brass} />
            <Text
              className="mt-4 text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {"Processing receipt\u2026"}
            </Text>
            <Text
              className="mt-1 text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              {"Recognizing text on-device"}
            </Text>
          </View>
        </View>
      )}

      {/* ── Top bar ── */}
      <View className="pt-safe" style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="active:opacity-0"
        >
          <Lucide name="x" size={24} color={c.textPrimary} />
        </Pressable>
        <Text
          className="text-xs font-mono tracking-[0.06em]"
          style={{ color: c.textPrimary }}
        >
          Flash: Auto
        </Text>
      </View>

      {/* ── Scan caption (only when idle) ── */}
      {!result && !error && !isProcessing && (
        <Text
          className="font-mono text-xs tracking-[0.04em]"
          style={styles.caption}
        >
          {"Align receipt in frame \u00B7 processed on-device"}
        </Text>
      )}

      {/* ── Frosted blur around the scan box (only when idle) ── */}
      {!result && !error && !isProcessing && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* Top strip */}
          <BlurView
            intensity={60}
            tint="dark"
            style={[
              styles.scrim,
              { top: 0, left: 0, right: 0, height: frame.top },
            ]}
          />
          {/* Left strip */}
          <BlurView
            intensity={60}
            tint="dark"
            style={[
              styles.scrim,
              { top: frame.top, left: 0, width: frame.left, bottom: 0 },
            ]}
          />
          {/* Right strip */}
          <BlurView
            intensity={60}
            tint="dark"
            style={[
              styles.scrim,
              { top: frame.top, right: 0, width: frame.right, bottom: 0 },
            ]}
          />
          {/* Bottom strip */}
          <BlurView
            intensity={60}
            tint="dark"
            style={[
              styles.scrim,
              {
                top: frame.top + frame.height,
                left: frame.left,
                right: frame.right,
                bottom: 0,
              },
            ]}
          />
        </View>
      )}

      {/* ── Receipt frame overlay (only when idle) ── */}
      {!result && !error && !isProcessing && (
        <View
          style={[
            styles.receiptFrame,
            {
              top: frame.top,
              left: frame.left,
              right: frame.right,
              height: frame.height,
              borderColor: colors.brass,
            },
          ]}
        />
      )}

      {/* ── Error display ── */}
      {error && !isProcessing && (
        <View
          className="absolute bottom-44 left-5 right-5 z-10 rounded-2xl border px-4 py-4"
          style={{
            backgroundColor: c.surfaceCard,
            borderColor: colors.rust,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Lucide name="triangle-alert" size={16} color={colors.rust} />
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: colors.rust }}
            >
              {error}
            </Text>
          </View>
          <Pressable onPress={handleRetake} className="mt-3 active:opacity-60">
            <Text
              className="text-center text-xs font-manrope-semibold"
              style={{ color: c.brassText }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Shutter button (only when idle) ── */}
      {!result && !error && !isProcessing && (
        <View style={styles.shutterRow}>
          <Pressable
            onPress={handleShutter}
            className="active:opacity-80"
            style={[styles.shutterRing, { borderColor: colors.parchment }]}
          >
            <View
              style={[styles.shutterInner, { backgroundColor: colors.brass }]}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    backgroundColor: "rgba(8,9,13,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  caption: {
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    textAlign: "center",
    // Draw above the frosted scrim around the scan box
    zIndex: 6,
    color: colors.textPrimary,
  },
  receiptFrame: {
    position: "absolute",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    overflow: "hidden",
  },
  scrim: {
    position: "absolute",
    // Light translucent base — BlurView's `tint="dark"` adds the rest so the
    // frost stays consistent across platforms.
    backgroundColor: "rgba(8,9,13,0.35)",
  },
  scanLine: {
    position: "absolute",
    top: "10%",
    left: "8%",
    right: "8%",
    height: 2,
    opacity: 0.7,
  },
  shutterRow: {
    position: "absolute",
    bottom: 35,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  shutterRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
});
