/**
 * PhoneInputScreen.tsx — Enter Pakistani mobile number to request an OTP.
 *
 * Client-side validation: E.164 format check before calling the API.
 * Server-side validation: backend rejects malformed numbers too (Rules.md).
 */

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight } from "../../theme/typography";
import { Button } from "../../components/Button";
import { TextInput } from "../../components/TextInput";
import { sendOTP } from "../../services/authService";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Basic E.164 client-side check — server will enforce fully
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function PhoneInputScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const validate = (): boolean => {
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError(t("common.error_generic"));
      return false;
    }
    if (!E164_REGEX.test(trimmed)) {
      setPhoneError(t("auth.phone_hint"));
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await sendOTP(phone.trim());
      setDevOtp(res.dev_otp); // will be shown as a hint in dev mode
      navigation.navigate("OTPVerify", { phone: phone.trim(), devOtp: res.dev_otp });
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
      >
        <View style={styles.top}>
          <Text style={styles.logoText}>سہولت</Text>
          <Text style={styles.title}>{t("auth.welcome_title")}</Text>
          <Text style={styles.subtitle}>{t("auth.welcome_subtitle")}</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label={t("auth.phone_label")}
            placeholder={t("auth.phone_placeholder")}
            hint={t("auth.phone_hint")}
            error={phoneError}
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (phoneError) setPhoneError("");
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
            onSubmitEditing={handleSend}
          />

          <Button
            label={t("auth.send_otp")}
            onPress={handleSend}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    padding: 32,
    justifyContent: "center",
    gap: 32,
  },
  top: {
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 40,
    color: Colors.primary,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: LineHeight.h1,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: LineHeight.body,
  },
  form: {
    gap: 8,
  },
});
