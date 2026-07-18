import { darkColors } from "./darkColors";
import { lightColors } from "./lightColors";

export type ColorPalette = typeof darkColors | typeof lightColors;

export { darkColors, lightColors };

/**
 * Default export — the dark palette.
 * Components using `useColors()` hook will get the active palette at runtime.
 * Direct `import { colors } from "@/theme/colors"` always gets the dark palette
 * (for static references like icon colours that don't change between themes).
 */
export const colors = darkColors;
