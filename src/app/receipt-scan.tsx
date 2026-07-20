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
  View,
} from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";
import { colors } from "@/theme/colors";
import { useToast } from "@/hooks/useToast";
import {
  extractReceiptData,
  isOcrAvailable,
  formatPhilippineCurrency,
  formatReceiptDate,
} from "@/lib/ocr";
import type { OcrResult } from "@/types";

// ─── screen ───────────────────────────────────────────────────────────────────

export default function ReceiptScanScreen() {
  const c = useColors();
  const toast = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // ── Permission loading ───────────────────────────────────────────────────

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-bg">
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
      <View className="flex-1 items-center justify-center bg-surface-bg px-5">
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
          className="rounded-2xl bg-brass px-5 py-3 active:opacity-80"
        >
          <Text
            className="text-sm font-manrope-bold"
            style={{ color: colors.ink }}
          >
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-surface-bg">
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
              {"Recognising text on-device"}
            </Text>
          </View>
        </View>
      )}

      {/* ── Top bar ── */}
      <View className="pt-safe" style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="active:opacity-60"
        >
          <Lucide name="x" size={24} color={c.textSecondary} />
        </Pressable>
        <Text
          className="text-xs font-mono tracking-[0.06em]"
          style={{ color: c.textSecondary }}
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

      {/* ── Receipt frame overlay (only when idle) ── */}
      {!result && !error && !isProcessing && (
        <View style={[styles.receiptFrame, { borderColor: colors.brass }]}>
          <View style={[styles.scanLine, { backgroundColor: colors.brass }]} />
        </View>
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
              style={{ color: colors.brass }}
            >
              Try again
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Detected card ── */}
      {result && !isProcessing && (
        <View
          className="absolute bottom-44 left-5 right-5 z-10 rounded-2xl border px-4 py-4"
          style={{
            backgroundColor: c.surfaceCard,
            borderColor: c.hairline,
          }}
        >
          {/* Detected tag */}
          <View className="mb-3 flex-row items-center gap-1.5">
            <Lucide name="circle-dot" size={12} color={colors.sage} />
            <Text
              className="text-[11px] font-mono"
              style={{ color: colors.sage }}
            >
              Detected on-device
            </Text>
          </View>

          {/* Merchant */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Merchant
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {result.merchant ?? "\u2014"}
            </Text>
          </View>

          {/* Amount */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Amount
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {result.amountCents != null
                ? formatPhilippineCurrency(result.amountCents)
                : "\u2014"}
            </Text>
          </View>

          {/* Date */}
          <View className="mb-2.5 flex-row justify-between">
            <Text
              className="text-xs font-manrope"
              style={{ color: c.textSecondary }}
            >
              Date
            </Text>
            <Text
              className="text-sm font-manrope-semibold"
              style={{ color: c.textPrimary }}
            >
              {formatReceiptDate(result.date)}
            </Text>
          </View>

          {/* Raw text preview */}
          <View
            className="mb-3 border-t pt-2.5"
            style={{ borderColor: c.hairline }}
          >
            <Text
              className="mb-1 text-[10px] font-mono"
              style={{ color: c.textSecondary }}
            >
              Raw OCR text
            </Text>
            <Text
              className="text-[10px] font-mono leading-[1.4]"
              style={{ color: c.textSecondary }}
              numberOfLines={4}
            >
              {result.rawText.slice(0, 200)}
              {result.rawText.length > 200 ? "\u2026" : ""}
            </Text>
          </View>

          {/* Use these details */}
          <Pressable
            onPress={handleConfirm}
            className="rounded-2xl bg-brass py-3.5 active:opacity-80"
          >
            <View className="flex-row items-center justify-center gap-1.5">
              <Text
                className="text-sm font-manrope-bold"
                style={{ color: colors.ink }}
              >
                Use these details
              </Text>
              <Lucide name="arrow-right" size={16} color={colors.ink} />
            </View>
          </Pressable>

          {/* Retake */}
          <Pressable
            onPress={handleRetake}
            className="mt-3 active:opacity-60"
            style={{ alignItems: "center" }}
          >
            <Text
              className="text-xs font-manrope-semibold"
              style={{ color: c.textSecondary }}
            >
              Retake photo
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
    top: 100,
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 5,
  },
  receiptFrame: {
    position: "absolute",
    top: 130,
    left: 38,
    right: 38,
    bottom: 240,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 10,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: "12%",
    left: "8%",
    right: "8%",
    height: 2,
    opacity: 0.7,
  },
  shutterRow: {
    position: "absolute",
    bottom: 40,
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
