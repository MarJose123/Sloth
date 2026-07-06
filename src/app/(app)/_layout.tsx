import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddTabButton } from "@/components/navigation/AddTabButton";
import { TabBarButton } from "@/components/navigation/TabBarButton";
import {
  AccountsIcon,
  HomeIcon,
  SettingsIcon,
  TransactionsIcon,
} from "@/components/navigation/icons";

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={{ flex: 1, backgroundColor: "#1B1F1A" }}>
      <TabSlot style={{ flex: 1 }} />

      <TabList
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingTop: 12,
          paddingBottom: (insets.bottom || 0) + 25,
          backgroundColor: "rgba(18,20,28,0.92)",
          borderTopWidth: 1,
          borderTopColor: "rgba(243,238,225,0.09)",
        }}
      >
        <TabTrigger name="dashboard" href="/(app)/dashboard" asChild>
          <TabBarButton label="Home" Icon={HomeIcon} />
        </TabTrigger>
        <TabTrigger name="accounts" href="/(app)/accounts" asChild>
          <TabBarButton label="Accounts" Icon={AccountsIcon} />
        </TabTrigger>
        <TabTrigger name="add" href="/(app)/add" asChild>
          <AddTabButton />
        </TabTrigger>
        <TabTrigger name="transactions" href="/(app)/transactions" asChild>
          <TabBarButton label="Transactions" Icon={TransactionsIcon} />
        </TabTrigger>
        <TabTrigger name="settings" href="/(app)/settings" asChild>
          <TabBarButton label="Settings" Icon={SettingsIcon} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
