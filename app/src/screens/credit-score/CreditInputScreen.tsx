/**
 * CreditInputScreen.tsx — Manual data entry for credit score inputs (Phase 2).
 *
 * Shown when the user hasn't submitted credit data yet, or taps "Update data".
 * Occupation-aware: land/crop fields only shown if user is a farmer.
 *
 * Rules.md compliance:
 * - All strings via i18n keys
 * - Client-side validation with immediate feedback (min 44x44 touch targets)
 * - Server-side validation errors displayed per-field
 */

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { creditService, CreditProfilePayload, UtilityType } from "../../services/creditService";
import { Colors } from "../../theme/colors";
import { Typography } from "../../theme/typography";

interface Props {
  onSaved: () => void;
  initialData?: Partial<CreditProfilePayload>;
}

const UTILITY_OPTIONS: { key: UtilityType; labelKey: string }[] = [
  { key: "electricity", labelKey: "credit_input.utility_electricity" },
  { key: "gas",         labelKey: "credit_input.utility_gas" },
  { key: "water",       labelKey: "credit_input.utility_water" },
  { key: "none",        labelKey: "credit_input.utility_none" },
];

export default function CreditInputScreen({ onSaved, initialData }: Props) {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.user?.profile);
  const isFarmer = profile?.occupation_type === "farmer";

  // ── Form state ─────────────────────────────────────────────────────────────
  const [landAcres, setLandAcres] = useState(
    initialData?.land_size_acres?.toString() ?? ""
  );
  const [cropMaunds, setCropMaunds] = useState(
    initialData?.crop_yield_maunds?.toString() ?? ""
  );
  const [utilityType, setUtilityType] = useState<UtilityType>(
    initialData?.utility_type ?? "electricity"
  );
  const [paidMonths, setPaidMonths] = useState(
    initialData?.utility_paid_months?.toString() ?? "0"
  );
  const [totalMonths, setTotalMonths] = useState(
    initialData?.utility_total_months?.toString() ?? "12"
  );
  const [hasCommittee, setHasCommittee] = useState(
    initialData?.has_committee_participation ?? false
  );
  const [hasRepayment, setHasRepayment] = useState(
    initialData?.has_prior_loan_repayment ?? false
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (isFarmer) {
      const la = parseFloat(landAcres);
      if (landAcres && (isNaN(la) || la < 0 || la > 1000)) {
        errs.land = t("credit_input.error_land");
      }
      const cm = parseFloat(cropMaunds);
      if (cropMaunds && (isNaN(cm) || cm < 0 || cm > 10000)) {
        errs.crop = t("credit_input.error_crop");
      }
    }

    const paid = parseInt(paidMonths, 10);
    const total = parseInt(totalMonths, 10);
    if (isNaN(paid) || paid < 0) errs.paid = t("credit_input.error_paid_months");
    if (isNaN(total) || total < 1) errs.total = t("credit_input.error_total_months");
    if (!isNaN(paid) && !isNaN(total) && paid > total) {
      errs.paid = t("credit_input.error_paid_exceeds_total");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreditProfilePayload = {
        utility_type: utilityType,
        utility_paid_months: parseInt(paidMonths, 10),
        utility_total_months: parseInt(totalMonths, 10),
        has_committee_participation: hasCommittee,
        has_prior_loan_repayment: hasRepayment,
      };
      if (isFarmer) {
        if (landAcres) payload.land_size_acres = parseFloat(landAcres);
        if (cropMaunds) payload.crop_yield_maunds = parseFloat(cropMaunds);
      }
      await creditService.upsertProfile(payload);
      onSaved();
    } catch (e: any) {
      const msg =
        e.response?.data?.detail?.message ?? t("common.error_generic");
      Alert.alert(t("common.error"), msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <Text style={styles.fieldError}>{errors[field]}</Text>
    ) : null;

  const SectionLabel = ({ text }: { text: string }) => (
    <Text style={styles.sectionLabel}>{text}</Text>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("credit_input.title")}</Text>
        <Text style={styles.subtitle}>{t("credit_input.subtitle")}</Text>

        {/* ── Farmer-only fields ─────────────────────────────────────── */}
        {isFarmer && (
          <View style={styles.section}>
            <SectionLabel text={t("credit_input.section_farm")} />

            <Text style={styles.fieldLabel}>{t("credit_input.land_label")}</Text>
            <TextInput
              style={[styles.input, errors.land ? styles.inputError : null]}
              keyboardType="decimal-pad"
              value={landAcres}
              onChangeText={setLandAcres}
              placeholder={t("credit_input.land_placeholder")}
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel={t("credit_input.land_label")}
            />
            <FieldError field="land" />

            <Text style={styles.fieldLabel}>{t("credit_input.crop_label")}</Text>
            <TextInput
              style={[styles.input, errors.crop ? styles.inputError : null]}
              keyboardType="decimal-pad"
              value={cropMaunds}
              onChangeText={setCropMaunds}
              placeholder={t("credit_input.crop_placeholder")}
              placeholderTextColor={Colors.textSecondary}
              accessibilityLabel={t("credit_input.crop_label")}
            />
            <FieldError field="crop" />
          </View>
        )}

        {/* ── Utility payment ────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text={t("credit_input.section_utility")} />
          <Text style={styles.hint}>{t("credit_input.utility_hint")}</Text>

          {/* Utility type selector */}
          <View style={styles.chipRow}>
            {UTILITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  utilityType === opt.key && styles.chipActive,
                ]}
                onPress={() => setUtilityType(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: utilityType === opt.key }}
              >
                <Text
                  style={[
                    styles.chipText,
                    utilityType === opt.key && styles.chipTextActive,
                  ]}
                >
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {utilityType !== "none" && (
            <>
              <Text style={styles.fieldLabel}>{t("credit_input.paid_label")}</Text>
              <Text style={styles.hint}>{t("credit_input.paid_hint", { total: totalMonths })}</Text>
              <View style={styles.monthsRow}>
                <View style={styles.monthsField}>
                  <TextInput
                    style={[styles.input, errors.paid ? styles.inputError : null]}
                    keyboardType="number-pad"
                    value={paidMonths}
                    onChangeText={setPaidMonths}
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    accessibilityLabel={t("credit_input.paid_label")}
                  />
                  <Text style={styles.monthsCaption}>{t("credit_input.paid_caption")}</Text>
                </View>
                <Text style={styles.monthsSep}>{t("credit_input.of")}</Text>
                <View style={styles.monthsField}>
                  <TextInput
                    style={[styles.input, errors.total ? styles.inputError : null]}
                    keyboardType="number-pad"
                    value={totalMonths}
                    onChangeText={setTotalMonths}
                    placeholder="12"
                    placeholderTextColor={Colors.textSecondary}
                    accessibilityLabel={t("credit_input.total_months_label")}
                  />
                  <Text style={styles.monthsCaption}>{t("credit_input.total_caption")}</Text>
                </View>
              </View>
              <FieldError field="paid" />
              <FieldError field="total" />
            </>
          )}
        </View>

        {/* ── Committee participation ────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text={t("credit_input.section_savings")} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.fieldLabel}>{t("credit_input.committee_label")}</Text>
              <Text style={styles.hint}>{t("credit_input.committee_hint")}</Text>
            </View>
            <Switch
              value={hasCommittee}
              onValueChange={setHasCommittee}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={hasCommittee ? Colors.primary : Colors.textSecondary}
              accessibilityLabel={t("credit_input.committee_label")}
            />
          </View>
        </View>

        {/* ── Prior loan repayment ───────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text={t("credit_input.section_history")} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.fieldLabel}>{t("credit_input.repayment_label")}</Text>
              <Text style={styles.hint}>{t("credit_input.repayment_hint")}</Text>
            </View>
            <Switch
              value={hasRepayment}
              onValueChange={setHasRepayment}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={hasRepayment ? Colors.primary : Colors.textSecondary}
              accessibilityLabel={t("credit_input.repayment_label")}
            />
          </View>
        </View>

        {/* ── Save button ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={t("credit_input.save")}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t("credit_input.save")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  title: {
    ...Typography.H1,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    ...Typography.H3,
    color: Colors.primary,
    marginBottom: 12,
  },

  fieldLabel: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 8,
  },
  hint: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.Body,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
  inputError: {
    borderColor: Colors.error,
  },
  fieldError: {
    ...Typography.BodySmall,
    color: Colors.error,
    marginTop: 4,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minHeight: 44,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  monthsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  monthsField: { flex: 1 },
  monthsSep: {
    ...Typography.Body,
    color: Colors.textSecondary,
    paddingTop: 4,
  },
  monthsCaption: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleInfo: { flex: 1, marginRight: 12 },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...Typography.ButtonText,
    color: "#fff",
  },
});
