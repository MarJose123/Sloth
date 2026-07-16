import { Modal, Pressable, Text, View } from "react-native";
import { useColors } from "@/theme/ThemeContext";
import { XIcon } from "@/components/navigation/icons";

interface DonateQRModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Donate modal that displays a QR code and BTC/ETH addresses.
 * Colours react to the active theme via useColors().
 */
export function DonateQRModal({ visible, onClose }: DonateQRModalProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(8,9,13,0.6)" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {
            /* prevent dismiss when interacting with the card */
          }}
          className="w-full items-center px-[22px] pb-[22px] pt-5"
          style={{
            backgroundColor: colors.ink2,
            borderRadius: 22,
          }}
        >
          {/* ── close button ── */}
          <Pressable
            onPress={onClose}
            className="self-end active:opacity-60"
            accessibilityLabel="Close"
          >
            <XIcon size={24} color={colors.parchmentDim} />
          </Pressable>

          {/* ── title ── */}
          <Text
            className="mb-2 mt-1 text-center font-fraunces-medium text-xl"
            style={{ color: colors.parchment }}
          >
            Support Sloth
          </Text>
          <Text
            className="mb-5 text-center leading-relaxed"
            style={{
              color: colors.parchmentDim,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Sloth is free and always will be.{"\n"}
            If you find it useful, consider donating
            {"\n"}
            to support its development.
          </Text>

          {/* ── QR placeholder card ── */}
          <View
            className="mb-4 items-center"
            style={{
              backgroundColor: colors.parchment,
              borderRadius: 14,
              padding: 12,
              width: 168,
              height: 168,
            }}
          >
            <View
              style={{
                width: 144,
                height: 144,
                backgroundColor: colors.ink3,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.parchmentDim,
                  fontSize: 11,
                  fontFamily: "IBMPlexMono_400",
                }}
              >
                QR placeholder
              </Text>
            </View>
          </View>

          {/* ── address display ── */}
          <View
            className="mb-5 w-full rounded-lg px-3 py-2.5"
            style={{ backgroundColor: colors.ink3 }}
          >
            <Text
              className="text-center"
              style={{
                color: colors.parchmentDim,
                fontFamily: "IBMPlexMono_400",
                fontSize: 10.5,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              bc1q…sloth
            </Text>
          </View>

          {/* ── save button ── */}
          <Pressable
            onPress={() => {
              /* TODO: save QR to gallery */
            }}
            className="w-full items-center rounded-xl py-3 active:opacity-70"
            style={{ backgroundColor: colors.brass }}
          >
            <Text
              className="font-manrope-bold text-sm"
              style={{ color: colors.parchment }}
            >
              ⬇ Save to Photos
            </Text>
          </Pressable>

          {/* ── toast placeholder ── */}
          <Text
            className="mt-3 font-mono"
            style={{ color: colors.sage, fontSize: 11 }}
          >
            ✓ Saved to gallery
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
