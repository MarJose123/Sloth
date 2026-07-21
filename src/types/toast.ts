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

/** Toast theme types. Copied from src/config/toastTheme.ts for type-sharing. */

export interface ToastVariantTheme {
  bg: string;
  border: string;
  text: string;
}

export interface ToastTheme {
  success: ToastVariantTheme;
  error: ToastVariantTheme;
  warning: ToastVariantTheme;
  info: ToastVariantTheme;
}
