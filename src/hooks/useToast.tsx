/**
 * useToast.tsx
 *
 * Reusable hook wrapping sonner-native's toast() with the app's design-system
 * colors and Lucide icons. Use in place of Alert.alert() for lightweight notifications.
 *
 * @example
 *   const toast = useToast();
 *   toast.error("Something went wrong");
 *   toast.success("Saved!");
 *   toast.info("Just so you know…");
 */

import { toast } from "sonner-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useTheme } from "@/theme/ThemeContext";
import { getToastTheme } from "@/config/toastTheme";

// ─── icon components ───────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return <Lucide name="check" size={18} color={color} />;
}

function XIcon({ color }: { color: string }) {
  return <Lucide name="x" size={18} color={color} />;
}

function TriangleAlertIcon({ color }: { color: string }) {
  return <Lucide name="triangle-alert" size={18} color={color} />;
}

function InfoIcon({ color }: { color: string }) {
  return <Lucide name="info" size={18} color={color} />;
}

// ─── options type ──────────────────────────────────────────────────────────

interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
}

// ─── hook ──────────────────────────────────────────────────────────────────

export function useToast() {
  const { resolved } = useTheme();
  const theme = getToastTheme(resolved);

  return {
    /** A plain informational toast. */
    show(message: string, options?: ToastOptions) {
      toast(message, {
        description: options?.description,
        duration: options?.duration ?? 3000,
        id: options?.id,
        icon: <InfoIcon color={theme.info.text} />,
        style: {
          backgroundColor: theme.info.bg,
          borderColor: theme.info.border,
        },
        styles: {
          title: { color: theme.info.text },
          description: { color: theme.info.text },
        },
      });
    },

    /** A success toast. */
    success(message: string, options?: ToastOptions) {
      toast(message, {
        description: options?.description,
        duration: options?.duration ?? 3000,
        id: options?.id,
        icon: <CheckIcon color={theme.success.text} />,
        style: {
          backgroundColor: theme.success.bg,
          borderColor: theme.success.border,
        },
        styles: {
          title: { color: theme.success.text },
          description: { color: theme.success.text },
        },
      });
    },

    /** An error / alert toast. */
    error(message: string, options?: ToastOptions) {
      toast(message, {
        description: options?.description,
        duration: options?.duration ?? 4000,
        id: options?.id,
        icon: <XIcon color={theme.error.text} />,
        style: {
          backgroundColor: theme.error.bg,
          borderColor: theme.error.border,
        },
        styles: {
          title: { color: theme.error.text },
          description: { color: theme.error.text },
        },
      });
    },

    /** A warning toast. */
    warning(message: string, options?: ToastOptions) {
      toast(message, {
        description: options?.description,
        duration: options?.duration ?? 3500,
        id: options?.id,
        icon: <TriangleAlertIcon color={theme.warning.text} />,
        style: {
          backgroundColor: theme.warning.bg,
          borderColor: theme.warning.border,
        },
        styles: {
          title: { color: theme.warning.text },
          description: { color: theme.warning.text },
        },
      });
    },
  };
}

/** Alias for consistency with Sonner conventions. */
export const useSlothToast = useToast;

/** Convenience exports for use outside React components. */
export { toast };
