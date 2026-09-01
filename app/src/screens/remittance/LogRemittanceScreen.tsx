/**
 * LogRemittanceScreen.tsx — Form for logging cross-border remittance entries (Phase 9).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { logRemittance, getFxRates, FxRatesResponse } from '../../services/remittanceService';

type Props = NativeStackScreenProps<RootStackParamList, 'LogRemittance'>;

const CURRENCIES = ['USD', 'AED', 'SAR', 'GBP'];
const RELATIONSHIPS = ['spouse', 'parent', 'child', 'sibling', 'other'];

export default function LogRemittanceScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [relationship, setRelationship] = useState('spouse');
  const [notes, setNotes] = useState('');
  const [fxRates, setFxRates] = useState<FxRatesResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadRates() {
      try {
        const ratesData = await getFxRates();
        setFxRates(ratesData);
      } catch (err) {
        console.error('Failed to load FX rates for logging screen', err);
      }
    }
    loadRates();
  }, []);

  const amountNum = parseFloat(amountStr) || 0;
  const currentRate = fxRates?.rates[currency] || 278.5;
  const livePkrValue = amountNum * currentRate;

  const handleSubmit = async () => {
    if (!amountNum || amountNum <= 0) {
      Alert.alert(t('common.error'), t('remittance.error_invalid_amount'));
      return;
    }

    setSubmitting(true);
    try {
      await logRemittance({
        amount_received: amountNum,
        origin_currency: currency,
        sender_relationship: relationship,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to log remittance', err);
      Alert.alert(t('common.error'), t('remittance.error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={Icons.back} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('remittance.log_remittance_title')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Currency Selection Chips */}
        <Text style={styles.fieldLabel}>{t('remittance.select_currency')}</Text>
        <View style={styles.chipsRow}>
          {CURRENCIES.map(curr => {
            const active = currency === curr;
            return (
              <TouchableOpacity
                key={curr}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCurrency(curr)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{curr}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Input */}
        <TextInput
          label={t('remittance.amount_label', { currency })}
          value={amountStr}
          onChangeText={setAmountStr}
          keyboardType="numeric"
          placeholder="e.g. 500"
        />

        {/* Live Conversion Preview Card */}
        <Card style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{t('remittance.live_pkr_preview')}</Text>
            <Text style={styles.rateSubtitle}>
              1 {currency} = Rs. {currentRate.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.pkrPreviewValue}>
            Rs. {livePkrValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {fxRates?.is_fallback ? (
            <Text style={styles.outdatedNote}>* {t('remittance.rate_fallback_note')}</Text>
          ) : null}
        </Card>

        {/* Sender Relationship Chips */}
        <Text style={styles.fieldLabel}>{t('remittance.sender_relationship_label')}</Text>
        <View style={styles.chipsRow}>
          {RELATIONSHIPS.map(rel => {
            const active = relationship === rel;
            const relText = t(`remittance.relationship_${rel}`);
            return (
              <TouchableOpacity
                key={rel}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setRelationship(rel)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{relText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes Input */}
        <TextInput
          label={t('remittance.notes_label')}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Eid gift, monthly expenses"
          multiline
        />

        {/* Submit Button */}
        <Button
          label={t('remittance.save_record_button')}
          variant="primary"
          loading={submitting}
          onPress={handleSubmit}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  fieldLabel: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: Colors.surface,
  },
  previewCard: {
    padding: 16,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    alignItems: 'center',
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  rateSubtitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.primary,
    marginTop: 2,
  },
  pkrPreviewValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.success,
  },
  outdatedNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.warning,
    marginTop: 6,
  },
});
