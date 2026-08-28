/**
 * OnboardingScreen.tsx — One-time profile completion form (name, location, occupation).
 * Also asks about remittances as an optional boolean question.
 * On submit, calls PUT /onboarding/profile and navigates to Dashboard.
 */

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Button } from "../../components/Button";
import { TextInput } from "../../components/TextInput";
import { completeProfile } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type OccupationType = "farmer" | "daily_laborer" | "shopkeeper" | "other";

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { user, updateUser, language } = useAuthStore();

  const [name, setName] = useState(user?.profile?.name ?? "");
  const [location, setLocation] = useState(user?.profile?.location ?? "");
  const [occupation, setOccupation] = useState<OccupationType | null>(
    user?.profile?.occupation_type ?? null
  );
  const [receivesRemittances, setReceivesRemittances] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [occupationError, setOccupationError] = useState("");

  const occupations: { key: OccupationType; label: string }[] = [
    { key: "farmer", label: t("onboarding.occupation_farmer") },
    { key: "daily_laborer", label: t("onboarding.occupation_daily_laborer") },
    { key: "shopkeeper", label: t("onboarding.occupation_shopkeeper") },
    { key: "other", label: t("onboarding.occupation_other") },
  ];

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim() || name.trim().length < 2) {
      setNameError(t("common.error_generic"));
      valid = false;
    }
    if (!location.trim() || location.trim().length < 2) {
      setLocationError(t("common.error_generic"));
      valid = false;
    }
    if (!occupation) {
      setOccupationError(t("common.error_generic"));
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate() || !occupation) return;
    setLoading(true);
    try {
      const updatedProfile = await completeProfile({
        name: name.trim(),
        location: location.trim(),
        occupation_type: occupation,
        preferred_language: language,
        receives_remittances: receivesRemittances,
      });

      if (user) {
        updateUser({ ...user, profile: updatedProfile });
      }
      navigation.replace("Dashboard");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? t("common.error_generic");
      Alert.alert("", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("onboarding.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.subtitle")}</Text>

        {/* Name */}
        <TextInput
          label={t("onboarding.name_label")}
          placeholder={t("onboarding.name_placeholder")}
          error={nameError}
          value={name}
          onChangeText={(v) => { setName(v); if (nameError) setNameError(""); }}
          autoCapitalize="words"
          returnKeyType="next"
        />

        {/* Location */}
        <TextInput
          label={t("onboarding.location_label")}
          placeholder={t("onboarding.location_placeholder")}
          error={locationError}
          value={location}
          onChangeText={(v) => { setLocation(v); if (locationError) setLocationError(""); }}
          returnKeyType="done"
        />

        {/* Occupation */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("onboarding.occupation_label")}</Text>
          <View style={styles.optionGrid}>
            {occupations.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.optionChip,
                  occupation === item.key && styles.optionChipActive,
                ]}
                onPress={() => {
                  setOccupation(item.key);
                  setOccupationError("");
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: occupation === item.key }}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    occupation === item.key && styles.optionLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {occupationError ? (
            <Text style={styles.errorText}>{occupationError}</Text>
          ) : null}
        </View>

        {/* Remittances — optional */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("onboarding.remittances_label")}</Text>
          <View style={styles.optionRow}>
            {[
              { value: true, label: t("onboarding.remittances_yes") },
              { value: false, label: t("onboarding.remittances_no") },
            ].map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                style={[
                  styles.optionChip,
                  styles.optionChipHalf,
                  receivesRemittances === item.value && styles.optionChipActive,
                ]}
                onPress={() =>
                  setReceivesRemittances(
                    receivesRemittances === item.value ? null : item.value
                  )
                }
                accessibilityRole="radio"
                accessibilityState={{ checked: receivesRemittances === item.value }}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    receivesRemittances === item.value && styles.optionLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.optionChip, styles.optionChipHalf]}
              onPress={() => setReceivesRemittances(null)}
            >
              <Text style={[styles.optionLabel, styles.skipLabel]}>
                {t("onboarding.remittances_skip")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          label={loading ? t("onboarding.saving") : t("onboarding.continue")}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 32,
    paddingBottom: 48,
    gap: 4,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h1,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    lineHeight: LineHeight.body,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: LineHeight.small,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    minHeight: MinTapTarget,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  optionChipHalf: {
    flex: 1,
  },
  optionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  optionLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: LineHeight.body,
  },
  optionLabelActive: {
    color: Colors.primary,
    fontFamily: FontFamily.bodyBold,
  },
  skipLabel: {
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: 4,
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.error,
    lineHeight: LineHeight.small,
  },
  submitButton: {
    marginTop: 16,
  },
});
