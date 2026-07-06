import { Pressable, Text } from "react-native";

interface BrassButtonProps {
  label: string;
  onPress?: () => void;
}

export function BrassButton({ label, onPress }: BrassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-[14px] bg-brass p-4 active:opacity-80"
    >
      <Text className="font-manrope-bold text-[15px] text-ink">{label}</Text>
    </Pressable>
  );
}
