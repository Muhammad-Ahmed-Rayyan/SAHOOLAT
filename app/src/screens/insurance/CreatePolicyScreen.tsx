/**
 * CreatePolicyScreen.tsx — Policy creation flow (Phase 6: Parametric Crop Insurance).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { createPolicy } from '../../services/insuranceService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePolicy'>;

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Maize', 'Sugarcane'];

const THRESHOLDS = [
  { key: 'extreme_heat', icon: Icons.heat, defaultVal: '40.0' },
  { key: 'heavy_rainfall', icon: Icons.rain, defaultVal: '50.0' },
  { key: 'drought', icon: Icons.drought, defaultVal: '5.0' },
  { key: 'low_temp', icon: Icons.frost, defaultVal: '3.0' },
] as const;

export default function CreatePolicyScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [selectedCrop, setSelectedCrop] = useState<string>('Wheat');
  const [district, setDistrict] = useState<string>('Multan');
  const [thresholdType, setThresholdType] = useState<'extreme_heat' | 'heavy_rainfall' | 'drought' | 'low_temp'>('extreme_heat');
  const [thresholdValue, setThresholdValue] = useState<string>('40.0');
  const [sumInsured, setSumInsured] = useState<string>('50000');
  const [loading, setLoading] = useState<boolean>(false);

  // Errors
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [thresholdValueError, setThresholdValueError] = useState<string | null>(null);
  const [sumInsuredError, setSumInsuredError] = useState<string | null>(null);

  const numSumInsured = parseFloat(sumInsured) || 0;
  const calculatedPremium = Math.round(numSumInsured * 0.05);

  const handleSelectThresholdType = (type: 'extreme_heat' | 'heavy_rainfall' | 'drought' | 'low_temp', defaultVal: string) => {
    setThresholdType(type);
    setThresholdValue(defaultVal);
    setThresholdValueError(null);
  };

  const handleCreate = async () => {
    let valid = true;

    if (!district.trim()) {
      setDistrictError(t('insurance.create.error_district'));
      valid = false;
    } else {
      setDistrictError(null);
    }

    const tVal = parseFloat(thresholdValue);
    if (isNaN(tVal) || tVal <= 0) {
      setThresholdValueError(t('insurance.create.error_threshold_value'));
      valid = false;
    } else {
      setThresholdValueError(null);
    }

    if (isNaN(numSumInsured) || numSumInsured <= 0) {
      setSumInsuredError(t('insurance.create.error_sum_insured'));
      valid = false;
    } else {
      setSumInsuredError(null);
    }

    if (!valid) return;

    setLoading(true);
    try {
      await createPolicy({
        crop_type: selectedCrop,
        district: district.trim(),
        threshold_type: thresholdType,
        threshold_value: tVal,
        sum_insured: numSumInsured,
        premium_amount: calculatedPremium,
      });

      Alert.alert(
        t('common.save'),
        `${selectedCrop} policy for ${district} created successfully!`,
        [{ text: 'OK', onPress: () => navigation.navigate('Insurance') }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || t('common.error_generic');
      Alert.alert(t('common.error_generic'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={Icons.back} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t('insurance.create.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('insurance.create.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Crop Selection */}
        <Text style={styles.sectionLabel}>{t('insurance.create.crop_label')}</Text>
        <View style={styles.chipRow}>
          {CROPS.map(crop => {
            const isSelected = selectedCrop === crop;
            return (
              <TouchableOpacity
                key={crop}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCrop(crop)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {t(`insurance.create.crop_${crop.toLowerCase()}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* District Input */}
        <TextInput
          label={t('insurance.create.district_label')}
          placeholder={t('insurance.create.district_placeholder')}
          value={district}
          onChangeText={setDistrict}
          error={districtError || undefined}
        />

        {/* Protection Threshold Selection */}
        <Text style={styles.sectionLabel}>{t('insurance.create.threshold_label')}</Text>
        <View style={styles.thresholdGrid}>
          {THRESHOLDS.map(item => {
            const isSelected = thresholdType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.thresholdCard, isSelected && styles.thresholdCardSelected]}
                onPress={() => handleSelectThresholdType(item.key, item.defaultVal)}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.thresholdCardText, isSelected && styles.thresholdCardTextSelected]}>
                  {t(`insurance.threshold_type.${item.key}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Threshold numerical value input */}
        <TextInput
          label={t('insurance.create.threshold_value_label')}
          value={thresholdValue}
          onChangeText={setThresholdValue}
          keyboardType="decimal-pad"
          error={thresholdValueError || undefined}
        />

        {/* Sum Insured input */}
        <TextInput
          label={t('insurance.create.sum_insured_label')}
          placeholder={t('insurance.create.sum_insured_placeholder')}
          value={sumInsured}
          onChangeText={setSumInsured}
          keyboardType="numeric"
          error={sumInsuredError || undefined}
        />

        {/* Calculated Premium Preview Card */}
        <Card style={styles.previewCard}>
          <Ionicons name={Icons.shield} size={20} color={Colors.primary} />
          <Text style={styles.previewText}>
            {t('insurance.create.premium_preview', { amount: calculatedPremium.toLocaleString() })}
          </Text>
        </Card>

        <Button
          label={t('insurance.create.submit')}
          variant="primary"
          onPress={handleCreate}
          loading={loading}
          style={styles.submitBtn}
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
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  chipTextSelected: {
    color: Colors.background,
    fontFamily: FontFamily.bodyBold,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  thresholdCard: {
    width: '48%',
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  thresholdCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  thresholdCardText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  thresholdCardTextSelected: {
    color: Colors.primary,
    fontFamily: FontFamily.bodyBold,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primaryLight + '20',
    marginVertical: 16,
  },
  previewText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.primary,
    marginLeft: 10,
  },
  submitBtn: {
    marginTop: 8,
  },
});
