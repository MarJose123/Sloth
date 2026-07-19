/**
 * useToast.ts
 *
 * Reusable hook wrapping sonner-native's toast() with the app's design-system
 * colors. Use in place of Alert.alert() for lightweight notifications.
 *
 * @example
 *   const toast = useToast();
 *   toast.error("Something went wrong");
 *   toast.success("Saved!");
 *   toast("Just so you know…");
 */

import { toast } from "sonner-native";
import { useColors } from "@/theme/ThemeContext";

interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
}

export function useToast() {
  const colors = useColors();

  return {
    /** A plain informational toast. */
    show(message: string, options?: ToastOptions) {
      toast(message, {
        description: options?.description,
        duration: options?.duration ?? 3000,
        id: options?.id,
        style: {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.hairline,
        },
      });
    },

    /** A success toast (sage-toned). */
    success(message: string, options?: ToastOptions) {
      toast.success(message, {
        description: options?.description,
        duration: options?.duration ?? 3000,
        id: options?.id,
        style: {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.sage,
        },
      });
    },

    /** An error / alert toast (rust-toned). */
    error(message: string, options?: ToastOptions) {
      toast.error(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        id: options?.id,
        style: {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.rust,
        },
      });
    },

    /** A warning toast (brass-toned). */
    warning(message: string, options?: ToastOptions) {
      toast.warning(message, {
        description: options?.description,
        duration: options?.duration ?? 3500,
        id: options?.id,
        style: {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.brass,
        },
      });
    },
  };
}

/** Convenience exports for use outside React components. */
export { toast };
