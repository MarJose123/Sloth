import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowRightIcon, XIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";

// ─── types ────────────────────────────────────────────────────────────────────

interface DetectedReceipt {
  merchant: string;
  amount: string;
  date: string;
  category: string;
}

// ─── screen ───────────────────────────────────────────────────────────────────

/**
 * Receipt scan screen — Screen 13.
 *
 * SCAFFOLD: Real camera requires `expo-camera` which is not yet in
 * package.json. Add it with:
 *   bun add expo-camera@~57.0.0
 * then replace the placeholder viewport with a <CameraView> component.
 *
 * OCR requires an on-device vision library (e.g. @react-native-ml-kit/text-recognition
 * or expo-mlkit) and a parsing layer; both are deferred.
 */
export default function ReceiptScanScreen() {
  const colors = useColors();
  const [detected, setDetected] = useState<DetectedReceipt | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleShutter = () => {
    if (isProcessing) return;

    // TODO: Replace with real CameraView capture + OCR pipeline
    setIsProcessing(true);
    setTimeout(() => {
      setDetected({
        merchant: "Corner Market",
        amount: "$18.40",
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        category: "Groceries",
      });
      setIsProcessing(false);
    }, 1200);
  };

  const handleConfirm = () => {
    if (!detected) return;
    // TODO: Pass detected values into Add Transaction as initial state
    Alert.alert(
      "OCR not yet wired",
      "Detected values will pre-fill the Add Transaction form once the OCR pipeline is connected.",
      [
        {
          text: "Go to Add Transaction",
          onPress: () => router.replace("/transaction/new"),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Simulated camera viewport ── */}
      <View style={styles.viewport} />

      {/* ── Top bar ── */}
      <View style={styles.topBar} className="pt-safe">
        <Pressable
          onPress={() => router.back()}
          hitSlop={20}
          className="active:opacity-60"
        >
          <XIcon size={24} color={colors.parchmentDim} />
        </Pressable>

        <Text style={styles.flashLabel}>Flash: Auto</Text>
      </View>

      {/* ── Scan caption ── */}
      <Text style={styles.caption}>
        Align receipt in frame · processed on-device
      </Text>

      {/* ── Receipt frame overlay ── */}
      <View style={styles.receiptFrame}>
        {/* Animated scan-line — static in scaffold */}
        <View style={styles.scanLine} />
      </View>

      {/* ── Detected card ── */}
      {detected && (
        <View style={styles.detectedCard}>
          <Text style={styles.detectedTag}>◉ Detected on-device</Text>

          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Merchant</Text>
            <Text style={styles.detectedValue}>{detected.merchant}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Amount</Text>
            <Text style={styles.detectedValue}>{detected.amount}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Date</Text>
            <Text style={styles.detectedValue}>{detected.date}</Text>
          </View>
          <View style={styles.detectedRow}>
            <Text style={styles.detectedLabel}>Category</Text>
            <Text style={styles.detectedValue}>{detected.category}</Text>
          </View>

          <Pressable
            onPress={handleConfirm}
            style={styles.confirmBtn}
            className="active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <Text style={styles.confirmBtnLabel}>Use these details</Text>
              <ArrowRightIcon size={16} color={colors.ink} />
            </View>
          </Pressable>
        </View>
      )}

      {/* ── Shutter button ── */}
      {!detected && (
        <View style={styles.shutterRow}>
          <Pressable
            onPress={handleShutter}
            disabled={isProcessing}
            style={[styles.shutterRing, isProcessing && { opacity: 0.5 }]}
            className="active:opacity-80"
          >
            <View style={styles.shutterInner} />
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
    backgroundColor: "#08090D",
  },
  viewport: {
    ...StyleSheet.absoluteFill,
    // Simulated camera texture — replace with <CameraView style={StyleSheet.absoluteFill} />
    backgroundColor: "#0E1019",
    opacity: 0.95,
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
  topAction: {
    color: "#A79F8C",
    fontSize: 18,
  },
  flashLabel: {
    color: "#A79F8C",
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
    color: "#A79F8C",
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
    borderColor: "#C87B54",
    borderRadius: 10,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: "12%",
    left: "8%",
    right: "8%",
    height: 2,
    backgroundColor: "#C87B54",
    opacity: 0.7,
    // TODO: Animate this with Reanimated (scroll from top to bottom of frame)
  },
  detectedCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 110,
    zIndex: 5,
    backgroundColor: "#242920",
    borderWidth: 1,
    borderColor: "rgba(243,238,225,0.09)",
    borderRadius: 16,
    padding: 16,
  },
  detectedTag: {
    fontFamily: "IBMPlexMono_400Regular",
    fontSize: 11.5,
    color: "#7FA06B",
    marginBottom: 10,
  },
  detectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detectedLabel: {
    fontSize: 13,
    color: "#A79F8C",
    fontFamily: "Manrope_400Regular",
  },
  detectedValue: {
    fontSize: 14.5,
    color: "#F3EEE1",
    fontFamily: "Manrope_600SemiBold",
  },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: "#C87B54",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmBtnLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
    color: "#1B1F1A",
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
    borderColor: "#F3EEE1",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#C87B54",
  },
});
