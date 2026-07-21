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

import {
  useFonts as useFraunces,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";

export function useAppFonts() {
  const [loaded] = useFraunces({
    // Fraunces has no 450 weight in the static subset — 500Medium is the
    // closest available. The alias key must exactly match global.css.
    Fraunces_450: Fraunces_500Medium,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    // Manrope aliases match the --font-* keys in global.css
    Manrope_400: Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    // IBM Plex Mono aliases
    IBMPlexMono_400: IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  return loaded;
}
