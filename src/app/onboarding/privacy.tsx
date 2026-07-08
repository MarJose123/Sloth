import { View, Text } from "react-native";
import { router } from "expo-router";
import { FeatureRow } from "@/components/FeatureRow";
import { StepDots } from "@/components/StepDots";
import { BrassButton } from "@/components/ui/BrassButton";

const FEATURES = [
  {
    title: "No bank credentials, ever",
    description:
      "Add transactions by hand, receipt scan, or CSV import — never by logging in through us.",
  },
  {
    title: "Processed on your phone",
    description:
      "Categorization and receipt scanning run locally. Nothing is sent out to learn from your spending.",
  },
  {
    title: "Fully offline, always",
    description:
      "There's no server and no cloud. Back up manually to your own storage whenever you choose.",
  },
] as const;

export default function PrivacyExplainerScreen() {
  return (
    <View className="flex-1 bg-ink px-5 pt-safe">
      {/* ── Content ── */}
      <View className="flex-1">
        <Text className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em] text-parchment-dim">
          How it works
        </Text>

        <Text className="mb-1 mt-[34px] font-fraunces-medium text-[25px] leading-[31px] text-parchment">
          Three ways Sloth keeps this yours.
        </Text>

        <View className="mt-6">
          {FEATURES.map((feature, i) => (
            <FeatureRow
              key={feature.title}
              index={i + 1}
              title={feature.title}
              description={feature.description}
              isLast={i === FEATURES.length - 1}
            />
          ))}
        </View>
      </View>

      {/* ── Bottom nav ── */}
      <StepDots total={3} activeIndex={1} />
      <View className="pb-7">
        <BrassButton
          label="Continue"
          onPress={() => router.push("/onboarding/biometric")}
        />
      </View>
    </View>
  );
}
