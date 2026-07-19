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
