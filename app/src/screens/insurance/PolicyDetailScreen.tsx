/**
 * PolicyDetailScreen.tsx — Policy detail view with payout history (Phase 6: Parametric Crop Insurance).
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  getPolicyDetail,
  simulatePolicyTrigger,
  InsurancePolicyData,
} from '../../services/insuranceService';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyDetail'>;

export default function PolicyDetailScreen({ route, navigation }: Props) {
  const { policyId } = route.params;
  const { t } = useTranslation();

  const [policy, setPolicy] = useState<InsurancePolicyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    try {
      setErrorMsg(null);
      const data = await getPolicyDetail(policyId);
      setPolicy(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail?.message || t('common.error_generic'));
    } finally {
      setLoading(false);
    }
  }, [policyId, t]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSimulateTrigger = async () => {
    setSimulating(true);
    try {
      const updated = await simulatePolicyTrigger(policyId);
      setPolicy(updated);
      Alert.alert(
        t('insurance.trigger_banner_title'),
        `Simulated threshold trigger! Payout of Rs. ${updated.sum_insured.toLocaleString()} logged in audit trail.`
      );
    } catch (err: any) {
      Alert.alert(t('common.error_generic'), err.response?.data?.detail?.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (errorMsg || !policy) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg || 'Policy not found'}</Text>
        <Button label={t('common.back')} variant="ghost" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const startDateStr = new Date(policy.coverage_start_date).toLocaleDateString();
  const endDateStr = new Date(policy.coverage_end_date).toLocaleDateString();

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

  const statusColor = getStatusColor(policy.status);

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{policy.crop_type} Policy</Text>
          <Text style={styles.headerSubtitle}>{policy.district} District</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Overview Card */}
        <Card style={styles.mainCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {t(`insurance.status.${policy.status}`).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.policyIdText}>ID: {policy.id.slice(0, 8)}</Text>
          </View>


          <View style={styles.cardDivider} />

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('insurance.policy_card.sum_insured')}</Text>
              <Text style={styles.gridValue}>Rs. {policy.sum_insured.toLocaleString()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('insurance.policy_card.premium')}</Text>
              <Text style={styles.gridValue}>Rs. {policy.premium_amount.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('insurance.policy_card.threshold')}</Text>
              <Text style={styles.gridValue}>
                {t(`insurance.threshold_type.${policy.threshold_type}`)} ({policy.threshold_value})
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('insurance.detail.coverage_period')}</Text>
              <Text style={styles.gridValue}>{startDateStr} - {endDateStr}</Text>
            </View>
          </View>
        </Card>

        {/* Trigger and Payout Events Audit Log */}
        <Text style={styles.sectionTitle}>{t('insurance.detail.payout_events_title')}</Text>

        {policy.payout_events.length === 0 ? (
          <Card style={styles.emptyEventsCard}>
            <Ionicons name={Icons.info} size={32} color={Colors.textSecondary} />
            <Text style={styles.emptyEventsText}>{t('insurance.detail.no_events')}</Text>
          </Card>
        ) : (
          <View style={styles.eventsList}>
            {policy.payout_events.map(event => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Ionicons name={Icons.trigger} size={20} color={Colors.error} />
                  <Text style={styles.eventDate}>
                    {new Date(event.trigger_date).toLocaleString()}
                  </Text>
                  <View style={styles.simulatedTag}>
                    <Text style={styles.simulatedTagText}>{event.status}</Text>
                  </View>
                </View>
                <Text style={styles.eventReason}>{event.trigger_reason}</Text>
                <View style={styles.eventFooter}>
                  <Text style={styles.payoutLabel}>{t('insurance.detail.payout_amount')}:</Text>
                  <Text style={styles.payoutValue}>Rs. {event.payout_amount.toLocaleString()}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Demo Simulation Action Button */}
        <Button
          label={t('insurance.detail.simulate_trigger_button')}
          variant="secondary"
          onPress={handleSimulateTrigger}
          loading={simulating}
          style={styles.simulateButton}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  mainCard: {
    padding: 16,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  policyIdText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  gridValue: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emptyEventsCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyEventsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  eventsList: {
    gap: 12,
    marginBottom: 20,
  },
  eventCard: {
    padding: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  simulatedTag: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  simulatedTagText: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  eventReason: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payoutLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  payoutValue: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.error,
  },
  simulateButton: {
    marginTop: 8,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.error,
    marginBottom: 12,
  },
});
