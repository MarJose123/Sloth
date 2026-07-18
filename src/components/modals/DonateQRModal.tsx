import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image as RNImage,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { Image } from "expo-image";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useColors } from "@/theme/ThemeContext";
import Color from "color";

// ─── asset ────────────────────────────────────────────────────────────────────

const QR_ASSET = require("../../../assets/donationQrph.jpg");

// ─── component ────────────────────────────────────────────────────────────────

interface DonateQRModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DonateQRModal({ visible, onClose }: DonateQRModalProps) {
  const colors = useColors();
  const [saved, setSaved] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(async () => {
    try {
      // Request photo library permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sloth needs access to your photo library to save the QR code.",
        );
        return;
      }

      // Resolve the bundled asset URI and copy to a writable location
      const assetSource = RNImage.resolveAssetSource(QR_ASSET);
      const sourceFile = new File(assetSource.uri);
      const destFile = new File(Paths.cache, "sloth-donation-qr.jpg");
      await sourceFile.copy(destFile, { overwrite: true });

      // Save to device gallery
      await MediaLibrary.saveToLibraryAsync(destFile.uri);

      // Show success toast
      setSaved(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      Alert.alert("Save Failed", message);
    }
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: Color(colors.surfaceBg).alpha(0.6).string(),
        }}
      >
        <View
          className="w-[82%] rounded-[22px] border p-[26px]"
          style={{
            borderColor: colors.hairline,
            backgroundColor: colors.surfaceCard,
            overflow: "visible",
          }}
        >
          {/* ── Close button ── */}
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-3.5 z-10 active:opacity-60"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Lucide name="x" size={20} color={colors.textSecondary} />
          </Pressable>

          {/* ── Title ── */}
          <Text
            className="mt-1 text-center font-fraunces-medium text-[19px]"
            style={{ color: colors.textPrimary }}
          >
            Support Sloth
          </Text>
          <Text
            className="mt-1.5 text-center text-[12px] leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            {
              " Scan to send a one-time donation. Sloth has no ads, no subscriptions, and no tracking — this is the only way it's funded."
            }
          </Text>

          {/* ── QR code image ── */}
          <View
            className="mx-auto mt-5 h-[168px] w-[168px] items-center justify-center rounded-[14px] p-2"
            style={{
              backgroundColor: colors.parchment,
            }}
          >
            <Image
              source={QR_ASSET}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
              contentFit="cover"
            />
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={handleSave}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-[12px] py-[13px] active:opacity-80"
            style={{ backgroundColor: colors.brass }}
          >
            <Lucide name="download" size={16} color={colors.ink} />
            <Text
              className="font-manrope-bold text-[13.5px]"
              style={{ color: colors.ink }}
            >
              Save to Photos
            </Text>
          </Pressable>

          {/* ── Success toast ── */}
          {saved && (
            <View className="mt-2.5 flex-row items-center justify-center gap-1.5">
              <Lucide name="check" size={14} color={colors.sage} />
              <Text
                className="text-center font-mono text-[11px]"
                style={{ color: colors.sage }}
              >
                Saved to gallery
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
