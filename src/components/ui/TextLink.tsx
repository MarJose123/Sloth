import { Pressable, Text } from "react-native";

interface TextLinkProps {
  label: string;
  onPress: () => void;
  className?: string;
}

export function TextLink({ label, onPress, className = "" }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`items-center py-1 ${className}`}
    >
      <Text className="text-center text-[12.5px] text-parchment-dim underline">
        {label}
      </Text>
    </Pressable>
  );
}
