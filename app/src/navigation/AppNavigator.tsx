/**
 * AppNavigator.tsx — Root navigation configuration for Sahoolat.
 *
 * Stack structure:
 *   Splash → LanguageSelect → PhoneInput → OTPVerify → Onboarding → Dashboard
 *   Dashboard → [module screens]
 *
 * Committee routes: Committee (list) → CommitteeDetail → CreateCommittee
 * LoanMatcher → LoanMatcherScreen (Phase 4)
 *
 * Navigation replaces (not pushes) when transitioning between auth and app states
 * so users can't swipe back to the login screen from the dashboard.
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
import CommitteeListScreen from "../screens/committee/CommitteeListScreen";
import CommitteeDetailScreen from "../screens/committee/CommitteeDetailScreen";
import CreateCommitteeScreen from "../screens/committee/CreateCommitteeScreen";
import LoanMatcherScreen from "../screens/loan-matcher/LoanMatcherScreen";
import WalletScreen from "../screens/wallet/WalletScreen";
import LogIncomeScreen from "../screens/wallet/LogIncomeScreen";

import { Colors } from "../theme/colors";
import { FontFamily } from "../theme/typography";

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  PhoneInput: undefined;
  OTPVerify: { phone: string; devOtp: string | null };
  Onboarding: undefined;
  Dashboard: undefined;
  // Credit
  CreditScore: { moduleName?: string };
  // Committee
  Committee: { moduleName?: string };
  CommitteeDetail: { committeeId: string };
  CreateCommittee: undefined;
  // Loan matcher
  LoanMatcher: { moduleName?: string };
  // Wallet (Phase 5)
  Wallet: { moduleName?: string };
  LogIncome: undefined;
  // Placeholder modules
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

        {/* Credit module */}
        <Stack.Screen name="CreditScore" component={CreditScoreScreen} options={{ title: "" }} />

        {/* Committee module */}
        <Stack.Screen name="Committee" component={CommitteeListScreen} options={{ title: "" }} />
        <Stack.Screen
          name="CommitteeDetail"
          component={CommitteeDetailScreen}
          options={{ title: "" }}
        />
        <Stack.Screen
          name="CreateCommittee"
          component={CreateCommitteeScreen}
          options={{ title: "" }}
        />

        {/* Loan matcher (Phase 4) */}
        <Stack.Screen name="LoanMatcher" component={LoanMatcherScreen} options={{ title: "" }} />

        {/* Wallet (Phase 5) */}
        <Stack.Screen name="Wallet" component={WalletScreen} options={{ title: "" }} />
        <Stack.Screen name="LogIncome" component={LogIncomeScreen} options={{ title: "" }} />

        {/* Placeholder modules */}
        <Stack.Screen name="Insurance" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="SubsidyBot" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Literacy" component={PlaceholderScreen} options={{ title: "" }} />
        <Stack.Screen name="Remittance" component={PlaceholderScreen} options={{ title: "" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
