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
import Color from "color";

/**
 * Soft decorative glow blobs (brass top-right, sage bottom-left) that sit
 * behind a screen's content. Place inside a `relative` container with
 * `overflow: hidden`. `pointerEvents="none"` so they never intercept touches.
 */
export function GlowBackdrop() {
  const colors = useColors();
  return (
    <>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -70,
          top: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: Color(colors.brass).alpha(0.1).toString(),
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: -60,
          bottom: -90,
          width: 210,
          height: 210,
          borderRadius: 105,
          backgroundColor: Color(colors.sage).alpha(0.09).toString(),
        }}
      />
    </>
  );
}
