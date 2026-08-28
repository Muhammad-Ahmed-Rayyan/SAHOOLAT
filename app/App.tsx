/**
 * App.tsx — Sahoolat root component.
 *
 * Responsibilities:
 * 1. Load Google Fonts (Poppins, Nunito Sans) via expo-font
 * 2. Initialise react-i18next (imported locale side-effect)
 * 3. Hydrate auth state from SecureStore
 * 4. Hide native splash screen once fonts + hydration are complete
 * 5. Render AppNavigator
 */

import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  NunitoSans_400Regular,
  NunitoSans_700Bold,
} from "@expo-google-fonts/nunito-sans";

// Initialise i18n as a side-effect before any component renders
import "./src/locales/i18n";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/store/authStore";
import { Colors } from "./src/theme/colors";

// Keep the native splash screen visible while we load
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    NunitoSans_400Regular,
    NunitoSans_700Bold,
    // Urdu fonts — loaded via a CDN or bundled asset; fall back gracefully if unavailable
    // NotoNastaliqUrdu_400Regular: require('./assets/fonts/NotoNastaliqUrdu-Regular.ttf'),
    // NotoSansArabic_400Regular: require('./assets/fonts/NotoSansArabic-Regular.ttf'),
  });

  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isHydrating) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydrating]);

  if ((!fontsLoaded && !fontError) || isHydrating) {
    // Native splash screen is still visible — render a minimal fallback
    return (
      <View style={{ flex: 1, backgroundColor: Colors.primary }} />
    );
  }

  return <AppNavigator />;
}
