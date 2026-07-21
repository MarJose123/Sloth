/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

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
      <Text className="text-center text-[14.5px] text-text-secondary underline">
        {label}
      </Text>
    </Pressable>
  );
}
