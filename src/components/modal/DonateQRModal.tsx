import { Modal, Pressable, Text, View } from "react-native";
import { colors } from "@/theme/colors";

interface DonateQRModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Donate QR modal — Screen 16.
 * QR code generation and save-to-photos require expo-media-library +
 * a QR library (e.g. react-native-qrcode-svg); both are deferred.
 * The placeholder box maintains the correct layout so the real QR drops in.
 */
export function DonateQRModal({ visible, onClose }: DonateQRModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(8,9,13,0.7)" }}
      >
        <View
          className="relative rounded-[22px] border border-white/[0.09] bg-ink-2 p-6"
          style={{ width: "82%" }}
        >
          {/* ── Close ── */}
          <Pressable
            onPress={onClose}
            className="absolute right-4 top-3.5 active:opacity-60"
            hitSlop={12}
          >
            <Text className="text-base text-parchment-dim">✕</Text>
          </Pressable>

          {/* ── Title ── */}
          <Text className="mb-2 text-center font-fraunces-medium text-[19px] text-parchment">
            Support Sloth
          </Text>

          {/* ── Description ── */}
          <Text className="mb-5 text-center text-[12px] leading-[18px] text-parchment-dim">
            Scan to send a one-time donation. Sloth has no ads, no
            subscriptions, and no tracking — this is the only way it&apos;s
            funded.
          </Text>

          {/* ── QR placeholder ── */}
          <View
            className="mx-auto mb-4 items-center justify-center rounded-2xl bg-parchment"
            style={{ width: 168, height: 168, padding: 12 }}
          >
            {/* TODO: Replace with <QRCode value="..." size={144} /> */}
            <View
              className="h-full w-full items-center justify-center rounded-lg border border-dashed"
              style={{ borderColor: "rgba(27,31,26,0.3)" }}
            >
              <Text
                className="font-mono text-[12px]"
                style={{ color: colors.ink }}
              >
                QR code
              </Text>
            </View>
          </View>

          {/* ── Wallet address ── */}
          <View className="mb-4 rounded-[10px] bg-ink-3 px-3 py-2.5">
            <Text
              className="text-center font-mono text-[10.5px] text-parchment-dim"
              selectable
            >
              {/* TODO: Replace with real wallet address */}
              bc1q · · · · · · · · · · · · · · · · · ·
            </Text>
          </View>

          {/* ── Save button ── */}
          <Pressable
            onPress={() => {
              // TODO: Save QR image to photos via expo-media-library
            }}
            className="mb-2.5 flex-row items-center justify-center gap-2 rounded-2xl bg-brass py-3.5 active:opacity-80"
          >
            <Text className="font-manrope-bold text-[13.5px] text-ink">
              ⬇ Save to Photos
            </Text>
          </Pressable>

          {/* ── Confirmation (static for now) ── */}
          <Text className="text-center font-mono text-[11px] text-sage">
            Made slowly, on purpose.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
