import { View, Text } from "react-native";
import { router } from "expo-router";
import { DialFrame } from "@/components/DialFrame";
import { SlothMark } from "@/components/SlothMark";
import { StepDots } from "@/components/StepDots";
import { BrassButton } from "@/components/ui/BrassButton";

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-ink px-5 pt-safe">
      {/* ── Brand mark ──────────────────────────────────────────────
           pt-safe pushes this below the status bar so it's visible.
           Previously pt-3 (12px) < status bar height (~28dp) → hidden.
        ─────────────────────────────────────────────────────────── */}
      <Text className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-brass">
        Sloth
      </Text>

      {/* ── Spacer A ─────────────────────────────────────────────────
           Replicates the mockup's `margin-bottom: auto` on .top-mark:
           free vertical space is split equally between this spacer and
           Spacer B, centering the hero cluster between brand and dots.
        ─────────────────────────────────────────────────────────── */}
      <View style={{ flex: 1 }} />

      {/* ── Hero content ── */}
      <View className="items-center">
        <DialFrame size={132} innerSize={56}>
          <SlothMark size={34} />
        </DialFrame>

        <Text className="mt-8 text-center font-fraunces-medium text-[30px] leading-[36px] text-parchment">
          Your money.{"\n"}Your device.{"\n"}Nobody else&apos;s.
        </Text>

        <Text className="mt-3.5 px-2 text-center text-sm leading-[21px] text-parchment-dim">
          No bank logins. No third-party servers reading your transactions.
          Everything lives here, encrypted, and never leaves this device.
        </Text>
      </View>

      {/* ── Spacer B ── */}
      <View style={{ flex: 1 }} />

      {/* ── Bottom nav ── */}
      <StepDots total={3} activeIndex={0} />
      <View className="pb-7">
        <BrassButton
          label="Continue"
          onPress={() => router.push("/onboarding/privacy")}
        />
      </View>
    </View>
  );
}
