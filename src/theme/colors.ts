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

import { darkColors } from "./darkColors";
import { lightColors } from "./lightColors";
import type { IThemeColors } from "@/types";

export type ColorPalette = IThemeColors;

export { darkColors, lightColors };

/**
 * Default export — the dark palette.
 * Components using `useColors()` hook will get the active palette at runtime.
 * Direct `import { colors } from "@/theme/colors"` always gets the dark palette
 * (for static references like icon colours that don't change between themes).
 */
export const colors = darkColors;
