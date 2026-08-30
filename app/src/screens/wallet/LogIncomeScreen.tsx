/**
 * LogIncomeScreen.tsx — Simple form to log an income entry (Phase 5).
 *
 * Rules.md compliance:
 * - Client validation before any API call (empty / non-positive amount)
 * - Server errors displayed inline
 * - All strings via i18n (both EN and UR)
 * - Ionicons filled icons only — no emojis
 */

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight, MinTapTarget, Radius } from "../../theme/typography";
import { Icons } from "../../theme/icons";
import { logIncome } from "../../services/walletService";

export default function LogIncomeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  const validate = (): boolean => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setAmountError(t("wallet.error_amount"));
      return false;
    }
    setAmountError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await logIncome(parseFloat(amount), note.trim() || undefined);
      const msg = result.saved_amount
        ? t("wallet.success_with_save", { save: result.saved_amount.toLocaleString() })
        : "";
      Alert.alert(t("wallet.success_income"), msg || undefined, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      const message = e?.response?.data?.message ?? t("common.error_network");
      Alert.alert(t("common.error"), message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("wallet.log_income_title")}</Text>
          <Text style={styles.subtitle}>{t("wallet.log_income_subtitle")}</Text>
        </View>

        {/* Amount field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t("wallet.amount_label")}</Text>
          <View style={[styles.inputWrap, amountError ? styles.inputError : null]}>
            <Text style={styles.prefix}>Rs.</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(v) => { setAmount(v); setAmountError(null); }}
              keyboardType="numeric"
              placeholder={t("wallet.amount_placeholder")}
              placeholderTextColor={Colors.textSecondary}
              returnKeyType="next"
            />
          </View>
          {amountError && <Text style={styles.errorText}>{amountError}</Text>}
        </View>

        {/* Note field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t("wallet.note_label")}</Text>
          <TextInput
            style={[styles.inputWrap, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder={t("wallet.note_placeholder")}
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name={Icons.wallet} size={18} color={Colors.surface} />
          <Text style={styles.submitText}>
            {loading ? t("common.loading") : t("wallet.submit_income")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scroll: { padding: 24, gap: 20, paddingBottom: 48 },
  header: { gap: 4 },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: MinTapTarget,
    paddingHorizontal: 12,
    gap: 8,
  },
  inputError: { borderColor: Colors.error },
  prefix: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  noteInput: {
    alignItems: "flex-start",
    paddingVertical: 12,
    minHeight: 80,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.error,
    lineHeight: LineHeight.small,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
});
