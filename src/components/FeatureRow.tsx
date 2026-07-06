import { View, Text } from "react-native";

interface FeatureRowProps {
  index: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export function FeatureRow({
  index,
  title,
  description,
  isLast,
}: FeatureRowProps) {
  return (
    <View
      className={`flex-row items-start gap-3.5 py-4 border-t border-hairline ${isLast ? "border-b border-hairline" : ""}`}
    >
      <View className="h-[34px] w-[34px] items-center justify-center rounded-full border border-brass/40">
        <Text className="font-mono text-sm text-brass">{index}</Text>
      </View>
      <View className="flex-1">
        <Text className="mb-0.5 font-manrope-bold text-sm text-parchment">
          {title}
        </Text>
        <Text className="text-[12.5px] leading-[18px] text-parchment-dim">
          {description}
        </Text>
      </View>
    </View>
  );
}
