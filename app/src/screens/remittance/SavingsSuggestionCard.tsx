/**
 * SavingsSuggestionCard.tsx — Surfaced rule-based savings allocation recommendation (Phase 9).
 *
 * Explains WHY a specific savings percentage/amount is suggested by cross-referencing
 * the user's real Wallet auto-save rate and active Committee commitments.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { SavingsSuggestion } from '../../services/remittanceService';

interface Props {
  suggestion: SavingsSuggestion;
}

export function SavingsSuggestionCard({ suggestion }: Props) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const reasoningText = isUrdu ? suggestion.reasoning_ur : suggestion.reasoning_en;

  return (
    <Card style={styles.card}>
      {/* Top Banner Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Ionicons name={Icons.savings} size={22} color={Colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>{t('remittance.suggestion_title')}</Text>
          <Text style={styles.subtitle}>{t('remittance.suggestion_subtitle')}</Text>
        </View>
        <View style={styles.pctBadge}>
          <Text style={styles.pctBadgeText}>{suggestion.suggested_savings_pct}%</Text>
        </View>
      </View>

      {/* Suggested Amount Display */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>{t('remittance.suggested_amount_label')}</Text>
        <Text style={styles.amountValue}>
          Rs. {suggestion.suggested_savings_pkr.toLocaleString()}
        </Text>
      </View>

      {/* Reasoning Explanation Box */}
      <View style={styles.reasoningBox}>
        <Ionicons name={Icons.info} size={18} color={Colors.primary} style={styles.infoIcon} />
        <Text style={styles.reasoningText}>{reasoningText}</Text>
      </View>

      {/* Data Source Cross-reference Pills */}
      <View style={styles.pillsRow}>
        <View style={styles.dataPill}>
          <Ionicons name={Icons.wallet} size={14} color={Colors.textSecondary} />
          <Text style={styles.dataPillText}>
            {t('remittance.wallet_save_rate')}: {suggestion.wallet_auto_save_pct}%
          </Text>
        </View>
        {suggestion.active_committees_count > 0 && (
          <View style={styles.dataPill}>
            <Ionicons name={Icons.committee} size={14} color={Colors.textSecondary} />
            <Text style={styles.dataPillText}>
              {t('remittance.active_committees')}: {suggestion.active_committees_count}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight + '30',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  pctBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  pctBadgeText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  amountBox: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.success,
  },
  reasoningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight + '12',
    padding: 12,
    borderRadius: Radius.md,
    gap: 8,
    marginBottom: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  reasoningText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dataPillText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
});
