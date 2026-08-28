/**
 * OTPVerifyScreen.tsx — Enter the 6-digit OTP received by SMS.
 *
 * Features:
 * - 60s resend cooldown timer
 * - Dev mode banner showing the OTP (when devOtp is passed from PhoneInputScreen)
 * - Auto-submit when 6 digits entered
 * - Routes to Onboarding (new users) or Dashboard (returning users) on success
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Colors } from "../../theme/colors";
import {
  FontFamily,
  FontSize,
  LineHeight,
  Radius,
} from "../../theme/typography";
import { Button } from "../../components/Button";
import { TextInput } from "../../components/TextInput";
import { sendOTP, verifyOTP } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "OTPVerify">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const RESEND_COOLDOWN = 60;

export function OTPVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Props["route"]>();
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();

  const { phone, devOtp: initialDevOtp } = route.params;

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [devOtpVisible, setDevOtpVisible] = useState(!!initialDevOtp);
  const [currentDevOtp, setCurrentDevOtp] = useState<string | null>(initialDevOtp ?? null);

  // Countdown timer for resend
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const handleVerify = useCallback(async (otpValue: string) => {
    const trimmed = otpValue.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setOtpError("OTP must be exactly 6 digits");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      const res = await verifyOTP(phone, trimmed);
      await setAuth(res.access_token, res.user);

      if (!res.user.profile?.onboarding_completed) {
        navigation.replace("Onboarding");
      } else {
        navigation.replace("Dashboard");
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? t("common.error_generic");
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  }, [phone, navigation, setAuth, t]);

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    if (otpError) setOtpError("");
    if (digits.length === 6) handleVerify(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await sendOTP(phone);
      setCurrentDevOtp(res.dev_otp);
      setDevOtpVisible(!!res.dev_otp);
      setCooldown(RESEND_COOLDOWN);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      Alert.alert("", t("common.error_generic"));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Dev OTP banner */}
        {devOtpVisible && currentDevOtp && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>
              {t("auth.dev_otp_hint", { otp: currentDevOtp })}
            </Text>
          </View>
        )}

        <View style={styles.top}>
          <Text style={styles.title}>{t("auth.otp_title")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.otp_subtitle", { phone })}
          </Text>
        </View>

        <TextInput
          label=""
          placeholder={t("auth.otp_placeholder")}
          error={otpError}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={() => handleVerify(otp)}
          style={styles.otpInput}
        />

        <Button
          label={t("auth.otp_verify")}
          onPress={() => handleVerify(otp)}
          loading={loading}
          disabled={otp.length !== 6}
        />

        {/* Resend */}
        <Button
          label={
            cooldown > 0
              ? t("auth.otp_resend_timer", { seconds: cooldown })
              : t("auth.otp_resend")
          }
          variant="ghost"
          onPress={handleResend}
          disabled={cooldown > 0}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    gap: 16,
  },
  devBanner: {
    backgroundColor: Colors.warning,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 8,
  },
  devBannerText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: LineHeight.small,
  },
  top: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h1,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    lineHeight: LineHeight.body,
  },
  otpInput: {
    textAlign: "center",
    fontSize: FontSize.h2,
    letterSpacing: 8,
    fontFamily: FontFamily.headingBold,
  },
});
