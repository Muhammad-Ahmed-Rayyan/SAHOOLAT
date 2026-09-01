/**
 * InsuranceScreen.tsx — Policy status & overview screen (Phase 6: Parametric Crop Insurance).
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, LineHeight, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  getPolicies,
  runWeatherCheck,
  simulatePolicyTrigger,
  InsurancePolicyData,
} from '../../services/insuranceService';

type Props = NativeStackScreenProps<RootStackParamList, 'Insurance'>;

export default function InsuranceScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<InsurancePolicyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [checkingWeather, setCheckingWeather] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await getPolicies();
      setPolicies(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || t('common.error_generic');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPolicies();
  };

  const handleRunWeatherCheck = async () => {
    setCheckingWeather(true);
    try {
      const res = await runWeatherCheck();
      Alert.alert(
        t('insurance.run_check_button'),
        `${res.message}`,
        [{ text: 'OK', onPress: fetchPolicies }]
      );
    } catch (err: any) {
      Alert.alert(t('common.error_generic'), err.response?.data?.detail?.message || 'Failed to check weather data.');
    } finally {
      setCheckingWeather(false);
    }
  };

  const handleSimulateTrigger = async (policyId: string) => {
    try {
      const updated = await simulatePolicyTrigger(policyId);
      Alert.alert(
        t('insurance.trigger_banner_title'),
        `Trigger event simulated for ${updated.crop_type} in ${updated.district}! Payout amount: PKR ${updated.sum_insured.toLocaleString()}`
      );
      fetchPolicies();
    } catch (err: any) {
      Alert.alert('Simulation Error', err.response?.data?.detail?.message || 'Failed to simulate trigger.');
    }
  };

  // Find any policy with a triggered status or payout event to show top alert banner
  const triggeredPolicy = policies.find(p => p.status === 'triggered' || p.payout_events.length > 0);
  const latestPayout = triggeredPolicy?.payout_events[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered':
      case 'paid':
        return Colors.error;
      case 'monitoring':
        return Colors.warning;
      case 'active':
        return Colors.success;
      case 'expired':
        return Colors.textSecondary;
      default:
        return Colors.primary;
    }
  };


  const getThresholdIcon = (type: string) => {
    switch (type) {
      case 'extreme_heat':
        return Icons.heat;
      case 'heavy_rainfall':
        return Icons.rain;
      case 'drought':
        return Icons.drought;
      case 'low_temp':
        return Icons.frost;
      default:
        return Icons.weather;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={Icons.back} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('insurance.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('insurance.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('CreatePolicy')}
        >
          <Ionicons name={Icons.addCircle} size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Triggered Alert Banner if an event exists */}
        {triggeredPolicy && latestPayout && (
          <Card style={styles.triggerCard}>
            <View style={styles.triggerHeader}>
              <Ionicons name={Icons.trigger} size={24} color={Colors.background} />
              <Text style={styles.triggerTitle}>{t('insurance.trigger_banner_title')}</Text>
            </View>
            <Text style={styles.triggerBody}>
              {t('insurance.trigger_banner_body', {
                crop: triggeredPolicy.crop_type,
                district: triggeredPolicy.district,
                amount: latestPayout.payout_amount.toLocaleString(),
              })}
            </Text>
            <View style={styles.triggerReasonBox}>
              <Text style={styles.triggerReasonText}>{latestPayout.trigger_reason}</Text>
            </View>
          </Card>
        )}

        {/* Action button bar */}
        <View style={styles.actionRow}>
          <Button
            label={checkingWeather ? t('insurance.running_check') : t('insurance.run_check_button')}
            variant="secondary"
            onPress={handleRunWeatherCheck}
            loading={checkingWeather}
            fullWidth={false}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label={t('insurance.create_new')}
            variant="primary"
            onPress={() => navigation.navigate('CreatePolicy')}
            fullWidth={false}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : errorMsg ? (
          <Card style={styles.errorCard}>
            <Ionicons name={Icons.error} size={32} color={Colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button label={t('common.retry')} variant="ghost" onPress={fetchPolicies} />
          </Card>
        ) : policies.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name={Icons.shield} size={48} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{t('insurance.empty_title')}</Text>
            <Text style={styles.emptySubtitle}>{t('insurance.empty_subtitle')}</Text>
            <Button
              label={t('insurance.create_new')}
              variant="primary"
              onPress={() => navigation.navigate('CreatePolicy')}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          <View style={styles.policyList}>
            {policies.map(policy => {
              const statusColor = getStatusColor(policy.status);
              const iconName = getThresholdIcon(policy.threshold_type);

              return (
                <Card key={policy.id} style={styles.policyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cropInfo}>
                      <View style={styles.iconCircle}>
                        <Ionicons name={iconName} size={22} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.cropType}>{policy.crop_type}</Text>
                        <Text style={styles.districtText}>
                          <Ionicons name={Icons.location} size={12} color={Colors.textSecondary} />{' '}
                          {policy.district}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {t(`insurance.status.${policy.status}`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{t('insurance.policy_card.sum_insured')}</Text>
                      <Text style={styles.detailValue}>Rs. {policy.sum_insured.toLocaleString()}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{t('insurance.policy_card.premium')}</Text>
                      <Text style={styles.detailValue}>Rs. {policy.premium_amount.toLocaleString()}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{t('insurance.policy_card.threshold')}</Text>
                      <Text style={styles.detailValue}>
                        {t(`insurance.threshold_type.${policy.threshold_type}`)} ({policy.threshold_value})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <TouchableOpacity
                      style={styles.simulateBtn}
                      onPress={() => handleSimulateTrigger(policy.id)}
                    >
                      <Ionicons name={Icons.refresh} size={14} color={Colors.primary} />
                      <Text style={styles.simulateBtnText}>{t('insurance.policy_card.test_trigger')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => navigation.navigate('PolicyDetail', { policyId: policy.id })}
                    >
                      <Text style={styles.detailsBtnText}>{t('insurance.policy_card.view_details')}</Text>
                      <Ionicons name={Icons.chevronRight} size={16} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
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
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  triggerCard: {
    backgroundColor: Colors.error,
    marginBottom: 16,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  triggerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.background,
    marginLeft: 8,
  },
  triggerBody: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.background,
    marginBottom: 8,
  },
  triggerReasonBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: Radius.sm,
  },
  triggerReasonText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.background,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorCard: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.error,
    marginVertical: 12,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  emptyButton: {
    width: '100%',
  },
  policyList: {
    gap: 16,
  },
  policyCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cropType: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  districtText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  simulateBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
    marginLeft: 4,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailsBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
    marginRight: 2,
  },
});
