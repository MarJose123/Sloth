import { Pressable, Text } from "react-native";

interface BrassButtonProps {
  label: string;
  onPress?: () => void;
}

export function BrassButton({ label, onPress }: BrassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="items-center rounded-2xl bg-brass p-4 active:opacity-80"
    >
      <Text className="font-sans text-[15px] font-bold text-ink">{label}</Text>
    </Pressable>
  );
}
