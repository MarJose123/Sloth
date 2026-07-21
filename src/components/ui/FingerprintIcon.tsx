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

import { Lucide } from "@react-native-vector-icons/lucide";
import { useColors } from "@/theme/ThemeContext";

interface FingerprintIconProps {
  size?: number;
  color?: string;
}

/**
 * Fingerprint icon using Lucide's `fingerprint` glyph.
 * Defaults to the theme's brass stroke colour but accepts an explicit override.
 */
export function FingerprintIcon({
  size = 24,
  color: explicitColor,
}: FingerprintIconProps) {
  const colors = useColors();
  const strokeColor = explicitColor ?? colors.brass;

  return <Lucide name="fingerprint" size={size} color={strokeColor} />;
}
