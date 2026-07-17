/**
 * Dark theme colour palette for Sloth.
 *
 * This is the default / original theme — deep ink backgrounds with
 * warm parchment text and brass accents.
 */
export const darkColors = {
  surfaceBg: "#1B1F1A",
  surfaceCard: "#242920",
  surfaceElevated: "#2E3428",
  textPrimary: "#F3EEE1",
  textSecondary: "#A79F8C",
  brass: "#C87B54",
  brassSoft: "#8F5636",
  sage: "#7FA06B",
  rust: "#9C4A3D",
  dustyBlue: "#6E8FB0",
  ochre: "#C9A227",
  /** Static — always #1B1F1A (CTA text on brass) */
  ink: "#1B1F1A",
  /** Static — always #F3EEE1 (QR / badge backgrounds) */
  parchment: "#F3EEE1",
  hairline: "rgba(243,238,225,0.09)",
  tabBar: "rgba(18,20,28,0.95)",
} as const;
