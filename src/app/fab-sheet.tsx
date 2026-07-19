import { useCallback } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import { ChevronRightIcon } from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";
import Color from "color";

// ─── action definition ────────────────────────────────────────────────────────

interface FabAction {
  icon: LucideIconName;
  label: string;
  description: string;
  route: string;
}

const ACTIONS: FabAction[] = [
  {
    icon: "pen-line",
    label: "Manual transaction",
    description: "Enter an expense or income by hand",
    route: "/transaction/create",
  },
  {
    icon: "camera",
    label: "Scan receipt",
    description: "Use the camera to capture receipt details",
    route: "/receipt-scan",
  },
  {
    icon: "credit-card",
    label: "New account",
    description: "Add a checking, savings, credit, or cash account",
    route: "/add-account",
  },
  {
    icon: "file-spreadsheet",
    label: "Import CSV/OFX",
    description: "Bulk import transactions from a file",
    route: "/import",
  },
];

// ─── screen ───────────────────────────────────────────────────────────────────

export default function FabSheetScreen() {
  const colors = useColors();
  const handleAction = useCallback((route: string) => {
    router.navigate(route);
  }, []);

  const handleDismiss = useCallback(() => {
    router.back();
  }, []);

  return (
    <View
      className="flex-1 justify-end"
      style={{ backgroundColor: "rgba(8,9,13,0.6)" }}
    >
      {/* Tappable scrim — dismisses the sheet */}
      <Pressable
        onPress={handleDismiss}
        className="flex-1"
        accessibilityLabel="Close action sheet"
        accessibilityRole="button"
      />

      {/* Bottom sheet */}
      <View
        className="rounded-t-[22px] border-t px-5 pb-8 pt-2"
        style={{
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.hairline,
        }}
      >
        {/* Drag handle */}
        <View className="mb-5 items-center">
          <View
            className="h-1 w-9 rounded-full "
            style={{
              backgroundColor: colors.hairline,
            }}
          />
        </View>

        {/* Title */}
        <Text
          className="mb-6 text-center font-fraunces-medium text-lg "
          style={{
            color: colors.textPrimary,
          }}
        >
          Add to Sloth
        </Text>

        {/* Action rows */}
        {ACTIONS.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => handleAction(action.route)}
            className="mb-2.5 flex-row items-center gap-4 rounded-2xl border   px-4 py-3.5 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={{
              borderColor: colors.hairline,
              backgroundColor: colors.surfaceElevated,
            }}
          >
            {/* Icon tile */}
            <View
              className="h-11 w-11 items-center justify-center rounded-xl border"
              style={{
                borderColor: Color(colors.brass).alpha(0.3).toString(),
                backgroundColor: colors.surfaceElevated,
              }}
            >
              <Lucide name={action.icon} size={20} color={colors.brass} />
            </View>

            {/* Label + description */}
            <View className="flex-1">
              <Text
                className="font-manrope-bold text-[13px] "
                style={{
                  color: colors.textPrimary,
                }}
              >
                {action.label}
              </Text>
              <Text
                className="text-[11.5px] leading-4"
                style={{ color: colors.textSecondary }}
              >
                {action.description}
              </Text>
            </View>

            {/* Chevron */}
            <ChevronRightIcon size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
