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

import { IThemeColors } from "@/types";

/**
 * Light theme colour palette for Sloth.
 *
 * Surfaces become warm-light parchment tones; text becomes dark ink.
 * Accent colours (brass, sage, rust) are retained but adjusted for
 * sufficient contrast on light backgrounds.
 */
export const lightColors: IThemeColors = {
  surfaceBg: "#F5F0E4",
  surfaceCard: "#EBE6D8",
  surfaceElevated: "#E0DBCB",
  textPrimary: "#1B1F1A",
  textSecondary: "#6B6352",
  brass: "#C87B54",
  brassSoft: "#A96B42",
  sage: "#6B8D58",
  rust: "#9C4A3D",
  dustyBlue: "#6E8FB0",
  ochre: "#C9A227",
  /** Static — always #1B1F1A (CTA text on brass) */
  ink: "#1B1F1A",
  /** Static — always #F3EEE1 (QR / badge backgrounds) */
  parchment: "#F3EEE1",
  hairline: "rgba(27, 31, 26, 0.09)",
  tabBar: "rgba(235,230,216,0.95)",
};
