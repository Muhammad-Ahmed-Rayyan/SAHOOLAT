/**
 * SplashScreen.tsx — App launch screen shown while fonts load and auth hydration runs.
 * Transitions automatically to LanguageSelect (new user) or Dashboard (returning user).
 */

import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize } from "../../theme/typography";
import { useAuthStore } from "../../store/authStore";
import { getMe } from "../../services/authService";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { isHydrating, isAuthenticated, updateUser, logout } = useAuthStore();

  useEffect(() => {
    if (isHydrating) return; // wait for token hydration to finish

    const bootstrap = async () => {
      if (isAuthenticated) {
        // Validate token and get latest user state
        try {
          const user = await getMe();
          updateUser(user);
          if (user.profile?.onboarding_completed) {
            navigation.replace("Dashboard");
          } else {
            navigation.replace("Onboarding");
          }
        } catch {
          // Token invalid / expired → logout and go to auth
          await logout();
          navigation.replace("LanguageSelect");
        }
      } else {
        navigation.replace("LanguageSelect");
      }
    };

    bootstrap();
  }, [isHydrating]);

  return (
    <View style={styles.container}>
      {/* Logo placeholder — replace with actual asset when available */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>سہولت</Text>
        <Text style={styles.logoSubText}>Sahoolat</Text>
      </View>
      <Text style={styles.tagline}>ہر پاکستانی کے لیے مالی آزادی</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 56,
    color: Colors.background,
    letterSpacing: 1,
  },
  logoSubText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.primaryLight,
    marginTop: -4,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.background,
    opacity: 0.8,
    textAlign: "center",
  },
});
