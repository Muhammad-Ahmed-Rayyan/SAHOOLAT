/**
 * Card.tsx — Surface card component (cream background, border radius, subtle shadow).
 */

import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Colors } from "../theme/colors";
import { Radius } from "../theme/typography";

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated = false, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[styles.card, elevated && styles.elevated, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  elevated: {
    // Minimal shadow — warm app, not corporate
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3, // Android
  },
});
