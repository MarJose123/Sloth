import {
    useFonts as useFraunces,
    Fraunces_400Regular,
    Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import {
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

export function useAppFonts() {
    const [loaded] = useFraunces({
        Fraunces_450: Fraunces_500Medium, // closest static weight to the 450 used in mockup
        Fraunces_400Regular,
        Manrope_400: Manrope_400Regular,
        Manrope_600SemiBold,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        IBMPlexMono_400: IBMPlexMono_400Regular,
        IBMPlexMono_500Medium,
    });
    return loaded;
}
