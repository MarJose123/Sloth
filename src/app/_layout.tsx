import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
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

import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Fraunces_400Regular,
        Fraunces_500Medium,
        Fraunces_600SemiBold,
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        IBMPlexMono_400Regular,
        IBMPlexMono_500Medium,
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return <Stack screenOptions={{ headerShown: false }} />;
}
