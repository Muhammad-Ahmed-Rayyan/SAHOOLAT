/**
 * CreateCommitteeScreen.tsx — Form to create a new committee (ROSCA/BC).
 * On success navigates to CommitteeDetail for the newly created committee.
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
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight, MinTapTarget, Radius } from "../../theme/typography";
import { Icons } from "../../theme/icons";
import { Button } from "../../components/Button";
import { TextInput } from "../../components/TextInput";
import { createCommittee, type CycleFrequency, type PayoutMethod } from "../../services/committeeService";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FREQUENCIES: { key: CycleFrequency; labelKey: string }[] = [
  { key: "weekly", labelKey: "committee.frequency.weekly" },
  { key: "biweekly", labelKey: "committee.frequency.biweekly" },
  { key: "monthly", labelKey: "committee.frequency.monthly" },
];

const PAYOUT_METHODS: { key: PayoutMethod; labelKey: string; hintKey: string }[] = [
  {
    key: "fixed_order",
    labelKey: "committee.payout_method.fixed_order",
    hintKey: "committee.payout_method.fixed_order_hint",
  },
  {
    key: "lottery",
    labelKey: "committee.payout_method.lottery",
    hintKey: "committee.payout_method.lottery_hint",
  },
];

export default function CreateCommitteeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState<CycleFrequency>("monthly");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("fixed_order");
  const [memberLimit, setMemberLimit] = useState("5");
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [amountError, setAmountError] = useState("");
  const [memberError, setMemberError] = useState("");

  const validate = (): boolean => {
    let valid = true;
    if (!name.trim() || name.trim().length < 2) {
      setNameError(t("committee.create.error_name"));
      valid = false;
    }
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError(t("committee.create.error_amount"));
      valid = false;
    }
    const limit = parseInt(memberLimit, 10);
    if (isNaN(limit) || limit < 2 || limit > 50) {
      setMemberError(t("committee.create.error_limit"));
      valid = false;
    }
    return valid;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const committee = await createCommittee({
        name: name.trim(),
        contribution_amount: parseFloat(contributionAmount),
        cycle_frequency: frequency,
        payout_method: payoutMethod,
        member_limit: parseInt(memberLimit, 10),
      });
      navigation.replace("CommitteeDetail", { committeeId: committee.id });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? t("common.error_generic");
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
        <Text style={styles.title}>{t("committee.create.title")}</Text>
        <Text style={styles.subtitle}>{t("committee.create.subtitle")}</Text>

        {/* Committee name */}
        <TextInput
          label={t("committee.create.name_label")}
          placeholder={t("committee.create.name_placeholder")}
          value={name}
          onChangeText={(v) => { setName(v); if (nameError) setNameError(""); }}
          error={nameError}
          autoCapitalize="words"
        />

        {/* Contribution amount */}
        <TextInput
          label={t("committee.create.amount_label")}
          placeholder={t("committee.create.amount_placeholder")}
          value={contributionAmount}
          onChangeText={(v) => { setContributionAmount(v); if (amountError) setAmountError(""); }}
          error={amountError}
          keyboardType="numeric"
        />

        {/* Member limit */}
        <TextInput
          label={t("committee.create.limit_label")}
          placeholder="5"
          value={memberLimit}
          onChangeText={(v) => { setMemberLimit(v); if (memberError) setMemberError(""); }}
          error={memberError}
          keyboardType="numeric"
          hint={t("committee.create.limit_hint")}
        />

        {/* Cycle frequency */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("committee.create.frequency_label")}</Text>
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, frequency === f.key && styles.chipActive]}
                onPress={() => setFrequency(f.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: frequency === f.key }}
              >
                <Text style={[styles.chipText, frequency === f.key && styles.chipTextActive]}>
                  {t(f.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payout method */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t("committee.create.payout_method_label")}</Text>
          {PAYOUT_METHODS.map((pm) => (
            <TouchableOpacity
              key={pm.key}
              style={[styles.methodCard, payoutMethod === pm.key && styles.methodCardActive]}
              onPress={() => setPayoutMethod(pm.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: payoutMethod === pm.key }}
            >
              <View style={styles.methodRow}>
                <Ionicons
                  name={payoutMethod === pm.key ? "radio-button-on" : "radio-button-off"}
                  size={18}
                  color={payoutMethod === pm.key ? Colors.primary : Colors.textSecondary}
                />
                <View style={styles.methodText}>
                  <Text style={[styles.methodTitle, payoutMethod === pm.key && styles.methodTitleActive]}>
                    {t(pm.labelKey)}
                  </Text>
                  <Text style={styles.methodHint}>{t(pm.hintKey)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={loading ? t("common.loading") : t("committee.create.submit")}
          onPress={handleCreate}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 24, paddingBottom: 48, gap: 4 },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h2,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: LineHeight.small,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
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
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.background },
  chipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  chipTextActive: { color: Colors.primary, fontFamily: FontFamily.bodyBold },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  methodCardActive: { borderColor: Colors.primary, backgroundColor: Colors.background },
  methodRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  methodText: { flex: 1, gap: 2 },
  methodTitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  methodTitleActive: { color: Colors.primary, fontFamily: FontFamily.bodyBold },
  methodHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
  submitButton: { marginTop: 8 },
});
