import { View } from "react-native";
import { router, usePathname, Slot } from "expo-router";
import { AddTabButton } from "@/components/navigation/AddTabButton";
import { TabBarButton } from "@/components/navigation/TabBarButton";
import {
  AccountsIcon,
  HomeIcon,
  SettingsIcon,
  TransactionsIcon,
} from "@/components/navigation/icons";
import { useColors } from "@/theme/ThemeContext";

export default function AppLayout() {
  const pathname = usePathname();
  const colors = useColors();

  return (
    <View style={{ flex: 1 }}>
      <Slot />

      <View
        className="absolute  bottom-6 left-1/2 -ml-42 w-85 h-18 flex-row items-center border rounded-4xl overflow-visible shadow-2xl px-2"
        style={{
          backgroundColor: colors.tabBar,
          borderColor: colors.hairline,
        }}
      >
        <TabBarButton
          Icon={HomeIcon}
          isFocused={
            pathname === "/(app)/dashboard" ||
            pathname === "/dashboard" ||
            pathname === "/" ||
            pathname === "/(app)"
          }
          onPress={() => {
            router.navigate("/(app)/dashboard");
          }}
        />

        <TabBarButton
          Icon={AccountsIcon}
          isFocused={pathname === "/(app)/accounts" || pathname === "/accounts"}
          onPress={() => {
            router.navigate("/(app)/accounts");
          }}
        />

        <AddTabButton
          onPress={() => {
            router.push("/fab-sheet");
          }}
        />

        <TabBarButton
          Icon={TransactionsIcon}
          isFocused={
            pathname === "/(app)/transactions" || pathname === "/transactions"
          }
          onPress={() => {
            router.navigate("/(app)/transactions");
          }}
        />

        <TabBarButton
          Icon={SettingsIcon}
          isFocused={pathname === "/(app)/settings" || pathname === "/settings"}
          onPress={() => {
            router.navigate("/(app)/settings");
          }}
        />
      </View>
    </View>
  );
}
