/**
 * DashboardScreen.tsx — Main home screen with 8 module navigation tiles.
 *
 * Module priority logic (per Architecture.md):
 * - Farmer → Credit Score, Insurance, Loans prominent
 * - Daily laborer → Wallet, Committee prominent
 * - Shopkeeper → Wallet, Credit Score, Loans prominent
 * - Other/default → all modules equal weight
 *
 * For Phase 1, all module tiles navigate to PlaceholderScreen.
 * They'll be replaced with real screens as phases complete.
 */

import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Colors } from "../../theme/colors";
import {
  FontFamily,
  FontSize,
  LineHeight,
  MinTapTarget,
  Radius,
} from "../../theme/typography";
import { useAuthStore } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Module {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  color: string;
  screen: keyof RootStackParamList;
  forOccupations?: string[]; // if set, tile is shown prominently for these occupations
}

const MODULES: Module[] = [
  {
    id: "credit_score",
    titleKey: "dashboard.modules.credit_score",
    subtitleKey: "dashboard.modules.credit_score_sub",
    icon: "📊",
    color: Colors.primary,
    screen: "CreditScore",
    forOccupations: ["farmer", "shopkeeper"],
  },
  {
    id: "committee",
    titleKey: "dashboard.modules.committee",
    subtitleKey: "dashboard.modules.committee_sub",
    icon: "🤝",
    color: "#6B7E5A",
    screen: "Committee",
    forOccupations: ["daily_laborer", "farmer"],
  },
  {
    id: "loan_matcher",
    titleKey: "dashboard.modules.loan_matcher",
    subtitleKey: "dashboard.modules.loan_matcher_sub",
    icon: "💼",
    color: Colors.primaryLight,
    screen: "LoanMatcher",
    forOccupations: ["farmer", "shopkeeper"],
  },
  {
    id: "wallet",
    titleKey: "dashboard.modules.wallet",
    subtitleKey: "dashboard.modules.wallet_sub",
    icon: "👛",
    color: "#8A7E5C",
    screen: "Wallet",
    forOccupations: ["daily_laborer", "shopkeeper"],
  },
  {
    id: "insurance",
    titleKey: "dashboard.modules.insurance",
    subtitleKey: "dashboard.modules.insurance_sub",
    icon: "🌾",
    color: "#5C7A5C",
    screen: "Insurance",
    forOccupations: ["farmer"],
  },
  {
    id: "subsidy_bot",
    titleKey: "dashboard.modules.subsidy_bot",
    subtitleKey: "dashboard.modules.subsidy_bot_sub",
    icon: "🏛️",
    color: "#7A6E5C",
    screen: "SubsidyBot",
  },
  {
    id: "literacy",
    titleKey: "dashboard.modules.literacy",
    subtitleKey: "dashboard.modules.literacy_sub",
    icon: "📚",
    color: "#5C7A8A",
    screen: "Literacy",
  },
  {
    id: "remittance",
    titleKey: "dashboard.modules.remittance",
    subtitleKey: "dashboard.modules.remittance_sub",
    icon: "💸",
    color: "#8A6E5C",
    screen: "Remittance",
  },
];

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const occupation = user?.profile?.occupation_type;
  const userName = user?.profile?.name;

  // Sort: occupation-specific modules first, then the rest
  const sortedModules = [...MODULES].sort((a, b) => {
    const aRelevant = a.forOccupations?.includes(occupation ?? "") ?? false;
    const bRelevant = b.forOccupations?.includes(occupation ?? "") ?? false;
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return 0;
  });

  const handleLogout = () => {
    Alert.alert(
      t("settings.logout"),
      t("settings.logout_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.logout"),
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.replace("LanguageSelect");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {userName
              ? t("dashboard.greeting", { name: userName })
              : t("dashboard.greeting_generic")}
          </Text>
          {occupation && (
            <Text style={styles.occupationBadge}>
              {t(`onboarding.occupation_${occupation}`)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityLabel={t("settings.logout")}
        >
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* Module grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {sortedModules.map((mod) => (
          <TouchableOpacity
            key={mod.id}
            style={styles.tile}
            onPress={() =>
              navigation.navigate(mod.screen as any, {
                moduleName: t(mod.titleKey),
              } as any)
            }
            accessibilityLabel={t(mod.titleKey)}
            accessibilityRole="button"
          >
            <View style={[styles.tileIconContainer, { backgroundColor: mod.color + "22" }]}>
              <Text style={styles.tileIcon}>{mod.icon}</Text>
            </View>
            <Text style={styles.tileTitle}>{t(mod.titleKey)}</Text>
            <Text style={styles.tileSub}>{t(mod.subtitleKey)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h2,
  },
  occupationBadge: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
    marginTop: 2,
  },
  logoutButton: {
    minHeight: MinTapTarget,
    minWidth: MinTapTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 22,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  tile: {
    width: "47%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    minHeight: 120,
    justifyContent: "center",
    gap: 6,
  },
  tileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  tileIcon: {
    fontSize: 22,
  },
  tileTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: LineHeight.body,
  },
  tileSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
});
