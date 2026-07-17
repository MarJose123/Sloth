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

export default function AppLayout() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1 }} className="bg-surface-bg">
      <Slot />

      <View
        className="absolute bg-surface-bg bottom-6 left-1/2 -ml-[150px] w-[300px] h-[64px] flex-row items-center border border-hairline rounded-[32px] overflow-visible shadow-2xl px-2"
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
