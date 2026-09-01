/**
 * RemittanceScreen.tsx — Remittance Tracker & Savings Allocation Hub (Phase 9).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
  getRemittanceRecords,
  getFxRates,
  getSavingsSuggestion,
  RemittanceRecord,
  FxRatesResponse,
  SavingsSuggestion,
} from '../../services/remittanceService';
import { SavingsSuggestionCard } from './SavingsSuggestionCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Remittance'>;

export default function RemittanceScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [records, setRecords] = useState<RemittanceRecord[]>([]);
  const [fxRates, setFxRates] = useState<FxRatesResponse | null>(null);
  const [suggestion, setSuggestion] = useState<SavingsSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [recsData, fxData, suggData] = await Promise.all([
        getRemittanceRecords(),
        getFxRates(),
        getSavingsSuggestion(),
      ]);
      setRecords(recsData);
      setFxRates(fxData);
      setSuggestion(suggData);
    } catch (err) {
      console.error('Failed to load remittance screen data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const totalPkr = records.reduce((acc, r) => acc + r.converted_pkr_amount, 0);

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
          <Text style={styles.headerTitle}>{t('remittance.screen_title')}</Text>
        </View>
        <TouchableOpacity
          style={styles.trendIconBtn}
          onPress={() => navigation.navigate('RemittanceTrends')}
        >
          <Ionicons name={Icons.trendingUp} size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Outdated FX Warning Banner */}
        {fxRates?.is_fallback ? (
          <View style={styles.fallbackBanner}>
            <Ionicons name={Icons.error} size={18} color={Colors.warning} />
            <Text style={styles.fallbackText}>{t('remittance.fx_outdated_warning')}</Text>
          </View>
        ) : null}

        {/* Top Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>{t('remittance.total_received_pkr')}</Text>
              <Text style={styles.summaryValue}>Rs. {totalPkr.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.logActionBtn}
              onPress={() => navigation.navigate('LogRemittance')}
            >
              <Ionicons name={Icons.add} size={20} color={Colors.surface} />
              <Text style={styles.logActionText}>{t('remittance.log_button')}</Text>
            </TouchableOpacity>
          </View>

          {/* FX Rate Ticker */}
          {fxRates?.rates ? (
            <View style={styles.tickerContainer}>
              <Text style={styles.tickerTitle}>{t('remittance.fx_rates_ticker')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerRow}>
                {['USD', 'AED', 'SAR', 'GBP'].map(curr => (
                  <View key={curr} style={styles.tickerItem}>
                    <Text style={styles.tickerCurr}>{curr}</Text>
                    <Text style={styles.tickerRate}>
                      Rs. {fxRates.rates[curr] ? fxRates.rates[curr].toFixed(2) : '-'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </Card>

        {/* Savings Suggestion Component */}
        {suggestion ? <SavingsSuggestionCard suggestion={suggestion} /> : null}

        {/* Recent Records List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('remittance.recent_records_title')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RemittanceTrends')}>
            <Text style={styles.viewTrendsLink}>{t('remittance.view_trends_link')}</Text>
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name={Icons.currency} size={40} color={Colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>{t('remittance.no_records_msg')}</Text>
            <Button
              label={t('remittance.log_first_button')}
              variant="primary"
              onPress={() => navigation.navigate('LogRemittance')}
              style={{ marginTop: 12 }}
            />
          </Card>
        ) : (
          <View style={styles.recordsList}>
            {records.map(item => {
              const dateStr = new Date(item.date_received).toLocaleDateString();
              return (
                <Card key={item.id} style={styles.recordCard}>
                  <View style={styles.recordMainRow}>
                    <View style={styles.currencyBadge}>
                      <Text style={styles.currencyBadgeText}>{item.origin_currency}</Text>
                    </View>
                    <View style={styles.recordDetails}>
                      <Text style={styles.recordAmount}>
                        {item.amount_received.toLocaleString()} {item.origin_currency}
                      </Text>
                      <Text style={styles.recordMeta}>
                        {item.sender_relationship ? `${item.sender_relationship} • ` : ''}
                        {dateStr}
                      </Text>
                    </View>
                    <View style={styles.pkrBox}>
                      <Text style={styles.pkrAmount}>
                        Rs. {item.converted_pkr_amount.toLocaleString()}
                      </Text>
                      <Text style={styles.snapshotRate}>
                        @ Rs. {item.fx_rate_snapshot.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  {item.notes ? <Text style={styles.recordNotes}>{item.notes}</Text> : null}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  trendIconBtn: {
    padding: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '18',
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  fallbackText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.warning,
    flex: 1,
  },
  summaryCard: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  logActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
  },
  logActionText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  tickerContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  tickerTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  tickerRow: {
    gap: 10,
  },
  tickerItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tickerCurr: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  tickerRate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
  },
  viewTrendsLink: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.primary,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    padding: 16,
  },
  recordMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currencyBadgeText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  recordDetails: {
    flex: 1,
  },
  recordAmount: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  recordMeta: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pkrBox: {
    alignItems: 'flex-end',
  },
  pkrAmount: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.success,
  },
  snapshotRate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recordNotes: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    fontStyle: 'italic',
  },
});
