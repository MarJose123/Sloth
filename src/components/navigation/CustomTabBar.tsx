import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabBarButton } from "./TabBarButton";
import { AddTabButton } from "./AddTabButton";
import {
  AccountsIcon,
  HomeIcon,
  SettingsIcon,
  TransactionsIcon,
} from "./icons";
import { useColors } from "@/theme/ThemeContext";

// ── Tab bar types ─────────────────────────────────────────────────────
// We define a minimal interface compatible with expo-router's <Tabs>
// tabBar prop. The real types live in @react-navigation/bottom-tabs
// (not a direct dependency), so we accept any extra fields via index
// signatures.

interface TabRoute {
  key: string;
  name: string;
}

interface TabEmitter {
  (event: Record<string, any>): { defaultPrevented?: boolean };
}

interface MinimalTabNavigation {
  emit: TabEmitter;
  navigate: (name: string) => void;
}

interface CustomTabBarProps {
  state: { routes: TabRoute[]; index: number };
  navigation: MinimalTabNavigation;
}

const TAB_ICONS = {
  dashboard: HomeIcon,
  accounts: AccountsIcon,
  transactions: TransactionsIcon,
  settings: SettingsIcon,
} as const;

const TAB_LABELS: Record<string, string> = {
  dashboard: "Home",
  accounts: "Accounts",
  transactions: "Transactions",
  settings: "Settings",
};

/**
 * Custom tab bar for the standard expo-router <Tabs> navigator.
 * Renders 4 tabs + a centered FAB that opens the quick-add sheet.
 * Uses the project's design tokens and shared icon set.
 */
export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      className="flex-row items-center "
      style={{
        paddingTop: 8,
        paddingBottom: (insets.bottom || 0) + 18,
        backgroundColor: colors.tabBar,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
      }}
    >
      {/* Left two tabs: Home, Accounts */}
      {state.routes.slice(0, 2).map((route, index) => {
        const isFocused = state.index === index;
        const Icon =
          TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? HomeIcon;

        return (
          <TabBarButton
            key={route.key}
            label={TAB_LABELS[route.name] ?? route.name}
            Icon={Icon}
            isFocused={isFocused}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            }}
          />
        );
      })}

      {/* Centered FAB — opens the root-level fab-sheet modal */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/fab-sheet")}
          accessibilityRole="button"
          accessibilityLabel="Add"
        >
          <AddTabButton />
        </Pressable>
      </View>

      {/* Right two tabs: Transactions, Settings */}
      {state.routes.slice(2).map((route, index) => {
        const routeIndex = index + 2;
        const isFocused = state.index === routeIndex;
        const Icon =
          TAB_ICONS[route.name as keyof typeof TAB_ICONS] ?? HomeIcon;

        return (
          <TabBarButton
            key={route.key}
            label={TAB_LABELS[route.name] ?? route.name}
            Icon={Icon}
            isFocused={isFocused}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            }}
          />
        );
      })}
    </View>
  );
}

/**
 * Bridge: the real expo-router Tabs passes BottomTabBarProps which has
 * richer types than our minimal interface. The cast through unknown
 * silences the type mismatch without suppressing other errors.
 */
export function createCustomTabBar(): (props: any) => React.ReactElement {
  const CustomTabBarWrapper = (props: any) => (
    <CustomTabBar state={props.state} navigation={props.navigation} />
  );
  CustomTabBarWrapper.displayName = "CustomTabBarWrapper";
  return CustomTabBarWrapper;
}
