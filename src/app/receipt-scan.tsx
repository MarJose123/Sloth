import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Lucide } from "@react-native-vector-icons/lucide";
import { ArrowRightIcon, XIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";
import { extractReceiptData, type OcrResult } from "@/lib/ocr";

// ─── types ────────────────────────────────────────────────────────────────────

interface DetectedReceipt extends OcrResult {
  formattedAmount: string;
}

// ─── screen ───────────────────────────────────────────────────────────────────

/**
 * Receipt scan screen — Screen 13.
 *
 * Uses `expo-camera` for capture and `extractReceiptData` (OCR shim)
 * for processing. Detected values can be confirmed to pre-fill the
 * Add Transaction form.
 */
export default function ReceiptScanScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [detected, setDetected] = useState<DetectedReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleShutter = async () => {
    if (isProcessing || !camera) return;

    try {
      setIsProcessing(true);
      const photo = await camera.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        const result = await extractReceiptData(photo.uri);
        setDetected({
          ...result,
          formattedAmount: result.amountCents
            ? (result.amountCents / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })
            : "—",
        });
      }
    } catch (err) {
      Alert.alert("Capture Error", "Failed to take photo or process OCR.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!detected) return;

    // Pass detected values to the new transaction screen
    router.replace({
      pathname: "/transaction/new",
      params: {
        merchant: detected.merchant ?? "",
        amountCents: detected.amountCents?.toString() ?? "",
        date: detected.date ?? "",
        source: "scan",
      },
    });
  };

  if (!permission) {
    return <View style={[styles.root, { backgroundColor: colors.ink }]} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.ink,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <Text
          style={{
            color: colors.parchment,
            textAlign: "center",
            marginBottom: 20,
            fontFamily: "Manrope_400Regular",
          }}
        >
          Sloth needs camera access to scan receipts.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: colors.brass,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.ink, fontFamily: "Manrope_700Bold" }}>
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  const detectedStyle = {
    backgroundColor: colors.ink2,
    borderWidth: 1,
    borderColor: colors.hairline,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ink }]}>
      {/* ── Camera viewport ── */}
      <CameraView
        ref={(ref) => setCamera(ref)}
        style={styles.viewport}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* ── Top bar ── */}
      <View style={styles.topBar} className="pt-safe">
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="active:opacity-60"
        >
          <XIcon size={24} color={colors.parchmentDim} />
        </Pressable>

        <Text style={[styles.flashLabel, { color: colors.parchmentDim }]}>
          Flash: Auto
        </Text>
      </View>

      {/* ── Scan caption ── */}
      {!detected && (
        <Text style={[styles.caption, { color: colors.parchmentDim }]}>
          Align receipt in frame · processed on-device
        </Text>
      )}

      {/* ── Receipt frame overlay ── */}
      {!detected && (
        <View style={[styles.receiptFrame, { borderColor: colors.brass }]}>
          {/* Animated scan-line — static in scaffold */}
          <View style={[styles.scanLine, { backgroundColor: colors.brass }]} />
        </View>
      )}

      {/* ── Detected card ── */}
      {detected && (
        <View style={[styles.detectedCard, detectedStyle]}>
          <View className="flex-row items-center gap-1.5">
            <Lucide name="circle-dot" size={14} color={colors.sage} />
            <Text style={[styles.detectedTag, { color: colors.sage }]}>
              Detected on-device
            </Text>
          </View>

          <View style={styles.detectedRow}>
            <Text
              style={[styles.detectedLabel, { color: colors.parchmentDim }]}
            >
              Merchant
            </Text>
            <Text style={[styles.detectedValue, { color: colors.parchment }]}>
              {detected.merchant ?? "—"}
            </Text>
          </View>
          <View style={styles.detectedRow}>
            <Text
              style={[styles.detectedLabel, { color: colors.parchmentDim }]}
            >
              Amount
            </Text>
            <Text style={[styles.detectedValue, { color: colors.parchment }]}>
              {detected.formattedAmount}
            </Text>
          </View>
          <View style={styles.detectedRow}>
            <Text
              style={[styles.detectedLabel, { color: colors.parchmentDim }]}
            >
              Date
            </Text>
            <Text style={[styles.detectedValue, { color: colors.parchment }]}>
              {detected.date ?? "—"}
            </Text>
          </View>

          <Pressable
            onPress={handleConfirm}
            style={[styles.confirmBtn, { backgroundColor: colors.brass }]}
            className="active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <Text style={[styles.confirmBtnLabel, { color: colors.ink }]}>
                Use these details
              </Text>
              <ArrowRightIcon size={16} color={colors.ink} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setDetected(null)}
            className="mt-3 active:opacity-60"
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                color: colors.parchmentDim,
                fontFamily: "Manrope_400Regular",
                fontSize: 13,
              }}
            >
              Retake photo
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── Shutter button ── */}
      {!detected && (
        <View style={styles.shutterRow}>
          <Pressable
            onPress={handleShutter}
            disabled={isProcessing}
            style={[
              styles.shutterRing,
              { borderColor: colors.parchment },
              isProcessing && { opacity: 0.5 },
            ]}
            className="active:opacity-80"
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
// Inline StyleSheet so the camera overlay geometry works correctly — these
// absolute positions are intentional and cannot be expressed as Tailwind
// utility classes without arithmetic.

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  viewport: {
    ...StyleSheet.absoluteFillObject,
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
  flashLabel: {
    fontSize: 14.5,
    fontFamily: "Manrope_400Regular",
  },
  caption: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "IBMPlexMono_400Regular",
    fontSize: 12.5,
    letterSpacing: 0.4,
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
    // TODO: Animate this with Reanimated (scroll from top to bottom of frame)
  },
  detectedCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 110,
    zIndex: 5,
    borderRadius: 16,
    padding: 16,
  },
  detectedTag: {
    fontFamily: "IBMPlexMono_400Regular",
    fontSize: 11.5,
    marginBottom: 10,
  },
  detectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detectedLabel: {
    fontSize: 13,
    fontFamily: "Manrope_400Regular",
  },
  detectedValue: {
    fontSize: 14.5,
    fontFamily: "Manrope_600SemiBold",
  },
  confirmBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
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
