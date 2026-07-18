import { View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface PinDotsProps {
  length: number;
  filledCount: number;
}

export function PinDots({ length, filledCount }: PinDotsProps) {
  const colors = useColors();
  return (
    <View className="mb-10 flex-row justify-center gap-4">
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          className="h-3.5 w-3.5 rounded-full border-[1.5px]"
          style={{
            borderColor: i < filledCount ? undefined : colors.brass + "80", // brass/50 — alpha variant, no Tailwind equivalent
            backgroundColor: i < filledCount ? colors.brass : undefined,
          }}
        />
      ))}
    </View>
  );
}
