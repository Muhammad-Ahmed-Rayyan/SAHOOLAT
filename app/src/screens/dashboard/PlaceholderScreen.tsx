/**
 * PlaceholderScreen.tsx — Shared "coming soon" screen for modules not yet built.
 * Used by all stub module routes in Phase 1.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight } from "../../theme/typography";

export function PlaceholderScreen() {
  const route = useRoute();
  const { t } = useTranslation();
  const moduleName = (route.params as any)?.moduleName ?? route.name;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>{moduleName}</Text>
      <Text style={styles.subtitle}>{t("placeholder_screen.coming_soon")}</Text>
      <Text style={styles.description}>{t("placeholder_screen.description")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  icon: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: LineHeight.h2,
  },
  subtitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.primary,
    textAlign: "center",
    lineHeight: LineHeight.h3,
  },
  description: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: LineHeight.body,
  },
});
