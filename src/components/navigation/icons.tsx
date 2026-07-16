import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";

export interface TabIconProps {
  size?: number;
  color: string;
}

function makeIcon(name: LucideIconName) {
  const Icon = ({ size = 24, color }: TabIconProps) => (
    <Lucide name={name} size={size} color={color} />
  );
  Icon.displayName = `Icon(${name})`;
  return Icon;
}

export const HomeIcon = makeIcon("house");
export const AccountsIcon = makeIcon("wallet");
export const TransactionsIcon = makeIcon("list");
export const SettingsIcon = makeIcon("settings");
export const PlusIcon = makeIcon("plus");
export const ArrowLeftIcon = makeIcon("arrow-left");
export const ArrowRightIcon = makeIcon("arrow-right");
export const ChevronRightIcon = makeIcon("chevron-right");
export const XIcon = makeIcon("x");
