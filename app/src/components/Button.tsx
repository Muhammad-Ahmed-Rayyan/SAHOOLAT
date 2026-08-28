/**
 * Button.tsx — Primary reusable button component.
 *
 * Design.md requirements applied here:
 * - Minimum 44x44px tap target
 * - Rounded corners (8–12px radius)
 * - Poppins Medium 16px button text
 * - Uses Colors and typography from theme — no inline values
 */

import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { Colors } from "../theme/colors";
import { FontFamily, FontSize, MinTapTarget, Radius } from "../theme/typography";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = "primary",
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.background : Colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MinTapTarget,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.45,
  },
  // Labels
  label: {
    fontFamily: FontFamily.button,
    fontSize: FontSize.button,
  },
  primaryLabel: {
    color: Colors.background,
  },
  secondaryLabel: {
    color: Colors.primary,
  },
  ghostLabel: {
    color: Colors.primary,
  },
});
