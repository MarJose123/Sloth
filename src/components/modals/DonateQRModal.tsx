import { Modal, Pressable, Text, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";
import Color from "color";

interface DonateQRModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DonateQRModal({ visible, onClose }: DonateQRModalProps) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: Color(colors.surfaceBg).alpha(0.6).string(),
        }}
      >
        <View
          className="w-[82%] rounded-[22px] border  p-[26px]"
          style={{
            borderColor: colors.hairline,
            backgroundColor: colors.surfaceCard,
          }}
        >
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-3.5 z-10"
          >
            <Text
              className="text-[16px]"
              style={{ color: colors.textSecondary }}
            >
              ✕
            </Text>
          </Pressable>

          <Text
            className="mt-1 text-center font-fraunces-medium text-[19px] "
            style={{ color: colors.textPrimary }}
          >
            Support Sloth
          </Text>
          <Text
            className="mt-1.5 text-center text-[12px] leading-relaxed "
            style={{ color: colors.textSecondary }}
          >
            {
              " Scan to send a one-time donation. Sloth has no ads, no subscriptions, and no tracking — this is the only way it's funded."
            }
          </Text>

          <View
            className="mx-auto mt-5 h-[168px] w-[168px] items-center justify-center rounded-[14px] p-3"
            style={{
              backgroundColor: colors.parchment,
            }}
          >
            <View
              className="flex-1 w-full items-center justify-center rounded-[8px] border-2 border-dashed"
              style={{ borderColor: `${colors.ink}4d` }}
            >
              <Text
                className="font-mono text-[12px] tracking-widest"
                style={{ color: colors.ink }}
              >
                QRCODEPH
              </Text>
            </View>
          </View>

          <Pressable
            className="mt-4 items-center justify-center rounded-[12px]  py-[13px] active:opacity-80"
            style={{ backgroundColor: colors.brass }}
          >
            <Text
              className="font-manrope-bold text-[13.5px] "
              style={{ color: colors.ink }}
            >
              ⬇ Save to Photos
            </Text>
          </Pressable>

          <Text
            className="mt-2.5 text-center font-mono text-[11px] "
            style={{ color: colors.sage }}
          >
            ✓ Saved to gallery
          </Text>
        </View>
      </View>
    </Modal>
  );
}
