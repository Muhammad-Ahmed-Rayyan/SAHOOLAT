/**
 * LanguageSelectScreen.tsx — First screen for new users: choose Urdu or English.
 * Persists preference and navigates to PhoneInput.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { useAuthStore, type Language } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LanguageSelectScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { setLanguage, language } = useAuthStore();

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang);
    navigation.navigate("PhoneInput");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>سہولت</Text>
      </View>

      <Text style={styles.title}>{t("language_select.title")}</Text>
      <Text style={styles.subtitle}>{t("language_select.subtitle")}</Text>

      <View style={styles.buttonRow}>
        {/* Urdu option */}
        <TouchableOpacity
          style={[
            styles.langButton,
            language === "ur" && styles.langButtonActive,
          ]}
          onPress={() => handleSelect("ur")}
          accessibilityLabel="اردو"
          accessibilityRole="button"
        >
          <Text style={styles.langFlag}>🇵🇰</Text>
          <Text
            style={[
              styles.langLabel,
              language === "ur" && styles.langLabelActive,
            ]}
          >
            اردو
          </Text>
          <Text style={styles.langSublabel}>Urdu</Text>
        </TouchableOpacity>

        {/* English option */}
        <TouchableOpacity
          style={[
            styles.langButton,
            language === "en" && styles.langButtonActive,
          ]}
          onPress={() => handleSelect("en")}
          accessibilityLabel="English"
          accessibilityRole="button"
        >
          <Text style={styles.langFlag}>🇬🇧</Text>
          <Text
            style={[
              styles.langLabel,
              language === "en" && styles.langLabelActive,
            ]}
          >
            English
          </Text>
          <Text style={styles.langSublabel}>انگریزی</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 40,
    color: Colors.primary,
    textAlign: "center",
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: LineHeight.h2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: LineHeight.small,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  langButton: {
    flex: 1,
    minHeight: MinTapTarget * 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 6,
  },
  langButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  langFlag: {
    fontSize: 32,
  },
  langLabel: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h3,
  },
  langLabelActive: {
    color: Colors.primary,
  },
  langSublabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
});
