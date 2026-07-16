/**
 * Light theme colour palette for Sloth.
 *
 * Surfaces become warm-light parchment tones; text becomes dark ink.
 * Accent colours (brass, sage, rust) are retained but adjusted for
 * sufficient contrast on light backgrounds.
 */
export const lightColors = {
  /** Canvas / primary background */
  ink: "#F5F0E4",
  /** Card surface */
  ink2: "#EBE6D8",
  /** Input bg, icon bg */
  ink3: "#E0DBCB",
  /** Primary text */
  parchment: "#1B1F1A",
  /** Secondary text, labels */
  parchmentDim: "#6B6352",
  /** Primary accent, CTA buttons */
  brass: "#C87B54",
  /** Pressed state */
  brassSoft: "#A96B42",
  /** Income, success, secondary accent */
  sage: "#6B8D58",
  /** Alerts, negative balance, errors */
  rust: "#9C4A3D",
  /** Transit category ring */
  dustyBlue: "#6E8FB0",
  ochre: "#C9A227",
  hairline: "rgba(27, 31, 26, 0.09)",
  tabBar: "rgba(235,230,216,0.95)",
} as const;
