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
