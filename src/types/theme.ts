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

/** Theme types. */

export interface IThemeColors {
  surfaceBg: string;
  surfaceCard: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  brass: string;
  brassSoft: string;
  sage: string;
  rust: string;
  dustyBlue: string;
  ochre: string;
  ink: string;
  parchment: string;
  hairline: string;
  tabBar: string;
}

export type ColorPalette = IThemeColors;

export type ThemePreference = "light" | "dark" | "auto";

export interface ThemeContextValue {
  /** The user's stored preference: "light", "dark", or "auto" (follow system). */
  preference: ThemePreference;
  /** The resolved effective theme: always "light" or "dark". */
  resolved: "light" | "dark";
  /** The active colour palette matching the resolved theme. */
  palette: ColorPalette;
  /** True once the stored preference has been loaded from SecureStore. */
  loaded: boolean;
  /** Persist a new preference and apply it immediately. */
  setPreference: (preference: ThemePreference) => void;
}
