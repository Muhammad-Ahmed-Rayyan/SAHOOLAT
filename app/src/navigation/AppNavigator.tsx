/**
 * AppNavigator.tsx — Root navigation configuration for Sahoolat.
 *
 * Stack structure (single flat stack for simplicity in Phase 1):
 *   Splash → LanguageSelect → PhoneInput → OTPVerify → Onboarding → Dashboard
 *   Dashboard → [module placeholder screens]
 *
 * Navigation replaces (not pushes) when transitioning between auth and app states
 * so users can't swipe back to the login screen from the dashboard.
 *
 * Phase 2+ will introduce a tab or drawer navigator for the main app area.
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { SplashScreen } from "../screens/auth/SplashScreen";
import { LanguageSelectScreen } from "../screens/auth/LanguageSelectScreen";
import { PhoneInputScreen } from "../screens/auth/PhoneInputScreen";
import { OTPVerifyScreen } from "../screens/auth/OTPVerifyScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { DashboardScreen } from "../screens/dashboard/DashboardScreen";
import { PlaceholderScreen } from "../screens/dashboard/PlaceholderScreen";
import CreditScoreScreen from "../screens/credit-score/CreditScoreScreen";

import { Colors } from "../theme/colors";
import { FontFamily } from "../theme/typography";

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  PhoneInput: undefined;
  OTPVerify: { phone: string; devOtp: string | null };
  Onboarding: undefined;
  Dashboard: undefined;
  // Module placeholder screens — all accept an optional moduleName param
  CreditScore: { moduleName?: string };
  Committee: { moduleName?: string };
  LoanMatcher: { moduleName?: string };
  Wallet: { moduleName?: string };
  Insurance: { moduleName?: string };
  SubsidyBot: { moduleName?: string };
  Literacy: { moduleName?: string };
  Remittance: { moduleName?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: {
    fontFamily: FontFamily.heading,
  },
  contentStyle: { backgroundColor: Colors.background },
  animation: "slide_from_right" as const,
};

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={screenOptions}
      >
        {/* Auth flow */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LanguageSelect"
          component={LanguageSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PhoneInput"
          component={PhoneInputScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OTPVerify"
          component={OTPVerifyScreen}
          options={{ title: "" }}
        />

        {/* Onboarding */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />

        {/* Main app */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />

        {/* Module screens */}
        <Stack.Screen name="CreditScore" component={CreditScoreScreen} options={{ title: "" }} />
        <Stack.Screen name="Committee" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="LoanMatcher" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Wallet" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Insurance" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="SubsidyBot" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Literacy" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Remittance" component={PlaceholderScreen} options={{ title: "" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
