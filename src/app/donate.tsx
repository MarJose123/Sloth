import { useCallback, useRef, useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import { XIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";

const DONATION_ADDRESS = "0x1234...Sloth"; // placeholder — replace with real address

export default function DonateScreen() {
  const colors = useColors();
  const [saved, setSaved] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(() => {
    // Placeholder: in a real build, capture QR as image via react-native-view-shot
    // or similar, then MediaLibrary.saveToLibraryAsync(uri).
    // For now we simulate a save-success toast.
    setSaved(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSaved(false), 2500);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  return (
    <View className="flex-1 justify-center bg-surface-bg/60 px-5">
      {/* Modal card */}
      <View className="w-[82%] self-center rounded-[22px] border border-hairline bg-surface-card px-6 pb-8 pt-6">
        {/* Close button */}
        <View className="mb-4 flex-row justify-end">
          <Pressable
            onPress={handleClose}
            className="active:opacity-60"
            accessibilityLabel="Close donate modal"
            accessibilityRole="button"
            hitSlop={12}
          >
            <XIcon size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Title */}
        <Text className="mb-2 text-center font-fraunces-medium text-[21px] text-text-primary">
          Support Sloth
        </Text>

        {/* Descriptor */}
        <Text className="mb-6 text-center text-[13.5px] leading-[18px] text-text-secondary">
          Sloth is free, open-source, and will always be private. If you find it
          useful, consider donating to support ongoing development.
        </Text>

        {/* QR code box */}
        <View className="mb-4 items-center self-center rounded-[14px] bg-parchment p-3">
          <View
            className="h-[168px] w-[168px] items-center justify-center rounded-[14px] bg-parchment"
            accessibilityLabel="Donation QR code"
          >
            {/* Placeholder: QR code will render here via react-native-qrcode-svg */}
            <Text className="text-center font-mono text-[11px] text-ink">
              QR placeholder
            </Text>
          </View>
        </View>

        {/* Address */}
        <View className="mb-6 rounded-lg bg-surface-elevated px-3 py-2.5">
          <Text
            className="text-center font-mono text-[11.5px] text-text-secondary"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {DONATION_ADDRESS}
          </Text>
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSave}
          className="flex-row items-center justify-center gap-2 rounded-[14px] bg-brass p-4 active:opacity-80"
        >
          <Lucide name="download" size={16} color={colors.ink} />
          <Text className="font-manrope-bold text-[15px] text-ink">
            Save to Photos
          </Text>
        </Pressable>
      </View>

      {/* Toast */}
      {saved && (
        <View className="absolute bottom-12 left-0 right-0 items-center">
          <View className="flex-row items-center gap-1.5 rounded-full bg-sage/90 px-5 py-2.5">
            <Lucide name="check" size={14} color={colors.parchment} />
            <Text className="font-manrope-bold text-[13.5px] text-text-primary">
              Saved to gallery
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
