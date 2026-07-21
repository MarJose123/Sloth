/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

import { Lucide } from "@react-native-vector-icons/lucide";
import type { LucideIconName } from "@react-native-vector-icons/lucide";
import type { TabIconProps } from "@/types";

function makeIcon(name: LucideIconName) {
  const Icon = ({ size = 24, color, style }: TabIconProps) => (
    <Lucide name={name} size={size} color={color} style={style} />
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
