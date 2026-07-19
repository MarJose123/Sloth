/**
 * toastTheme.ts
 *
 * Dark and light colour palettes for Sonner Native toasts.
 * Aligns with Sloth's design system tokens (brass, sage, rust, etc.).
 */

import type { ToastTheme } from "@/types";

export const darkToastTheme: ToastTheme = {
  success: { bg: "#2E3428", border: "#7FA06B", text: "#F3EEE1" },
  error: { bg: "#2E2622", border: "#9C4A3D", text: "#F3EEE1" },
  warning: { bg: "#332A1A", border: "#C9A227", text: "#F3EEE1" },
  info: { bg: "#2E3428", border: "#7FA06B", text: "#F3EEE1" },
};

export const lightToastTheme: ToastTheme = {
  success: { bg: "#E8F2E8", border: "#5A8A4A", text: "#1B1F1A" },
  error: { bg: "#F5EBE8", border: "#B85A50", text: "#1B1F1A" },
  warning: { bg: "#FBF5E8", border: "#D4A944", text: "#1B1F1A" },
  info: { bg: "#E8F0F5", border: "#6E8FB0", text: "#1B1F1A" },
};

/** Resolve theme based on a resolved colour-scheme string. */
export function getToastTheme(resolved: "light" | "dark"): ToastTheme {
  return resolved === "dark" ? darkToastTheme : lightToastTheme;
}
