/**
 * Test utilities for component tests.
 *
 * Provides a mock ThemeProvider and helper to wrap components with it
 * so that `useColors()` and `useTheme()` return predictable values.
 */

import { darkColors } from "@/theme/colors";
import type { ColorPalette, ThemeContextValue } from "@/types";

/** Mock palette returned by useColors() in tests. */
export const mockPalette: ColorPalette = darkColors;

/** Mock theme context value. */
export const mockThemeContext: ThemeContextValue = {
  preference: "auto",
  resolved: "dark",
  palette: mockPalette,
  loaded: true,
  setPreference: jest.fn(),
};

/**
 * Mocks the `@/theme/ThemeContext` module so that `useColors()` and
 * `useTheme()` return the mock values above.
 *
 * Call this in a beforeAll or at the top of a test file, outside any test:
 *
 *   jest.mock("@/theme/ThemeContext", () => ({
 *     ...jest.requireActual("@/theme/ThemeContext"),
 *     useColors: () => mockPalette,
 *     useTheme: () => mockThemeContext,
 *   }));
 */
export const mockUseColors = () => mockPalette;
export const mockUseTheme = () => mockThemeContext;
