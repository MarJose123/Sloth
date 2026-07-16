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

      <TabList className="absolute bottom-6 left-1/2 -ml-[150px] w-[300px] h-[64px] flex-row items-center bg-[rgba(18,20,28,0.95)] border border-white/[0.09] rounded-[32px] overflow-visible shadow-2xl px-2">
        <TabTrigger
          name="dashboard"
          href="/(app)/dashboard"
          asChild
          style={{ flex: 1 }}
        >
          <TabBarButton label="Home" Icon={HomeIcon} />
        </TabTrigger>
        <TabTrigger
          name="accounts"
          href="/(app)/accounts"
          asChild
          style={{ flex: 1 }}
        >
          <TabBarButton label="Accounts" Icon={AccountsIcon} />
        </TabTrigger>
        <TabTrigger name="add" href="/(app)/add" asChild style={{ width: 72 }}>
          <AddTabButton />
        </TabTrigger>
        <TabTrigger
          name="transactions"
          href="/(app)/transactions"
          asChild
          style={{ flex: 1 }}
        >
          <TabBarButton label="Transactions" Icon={TransactionsIcon} />
        </TabTrigger>
        <TabTrigger
          name="settings"
          href="/(app)/settings"
          asChild
          style={{ flex: 1 }}
        >
          <TabBarButton label="Settings" Icon={SettingsIcon} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
