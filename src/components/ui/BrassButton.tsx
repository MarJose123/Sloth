import { Pressable, Text } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface BrassButtonProps {
  label: string;
  onPress?: () => void;
}

export function BrassButton({ label, onPress }: BrassButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-[14px] p-4 active:opacity-80"
      style={{ backgroundColor: colors.brass }}
    >
      <Text
        className="font-manrope-bold text-[15px]"
        style={{ color: colors.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
