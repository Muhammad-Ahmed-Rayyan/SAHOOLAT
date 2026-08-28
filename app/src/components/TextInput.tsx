/**
 * TextInput.tsx — Reusable form input with label, hint, and error display.
 * Validates both client-side immediately (visual feedback) and defers to server validation.
 * Per Rules.md: "never trust client-side validation alone."
 */

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  View,
} from "react-native";
import { Colors } from "../theme/colors";
import { FontFamily, FontSize, LineHeight, Radius } from "../theme/typography";

interface InputProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  containerStyle?: object;
}

export function TextInput({
  label,
  hint,
  error,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <RNTextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
          style,
        ]}
        placeholderTextColor={Colors.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: LineHeight.small,
  },
  input: {
    height: 52, // above 44px min tap target
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: LineHeight.body,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.error,
  },
  hintText: {
    marginTop: 4,
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
  errorText: {
    marginTop: 4,
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.error,
    lineHeight: LineHeight.small,
  },
});
