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

import { View } from "react-native";
import { useColors } from "@/theme/ThemeContext";

interface DialFrameProps {
  size?: number;
  children?: React.ReactNode;
}

export function DialFrame({ size = 150, children }: DialFrameProps) {
  const colors = useColors();

  return (
    <View
      className="items-center justify-center rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: `${colors.brass}55`,
        backgroundColor: `${colors.brass}1a`,
      }}
    >
      {children}
    </View>
  );
}
