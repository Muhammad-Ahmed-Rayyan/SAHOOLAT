/**
 * RemittanceTrendsScreen.tsx — Monthly Remittance Trend Chart Visualization (Phase 9).
 *
 * Reuses the existing dot-graph / bar trend visualization pattern from CreditScoreScreen & WalletScreen.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getRemittanceTrends, TrendItem } from '../../services/remittanceService';

type Props = NativeStackScreenProps<RootStackParamList, 'RemittanceTrends'>;

export default function RemittanceTrendsScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrends() {
      try {
        const data = await getRemittanceTrends();
        setTrends(data);
      } catch (err) {
        console.error('Failed to load remittance trends', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrends();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const maxPkr = trends.reduce((max, item) => Math.max(max, item.total_pkr), 1);
  const totalOverallPkr = trends.reduce((sum, item) => sum + item.total_pkr, 0);
  const avgMonthlyPkr = trends.length > 0 ? totalOverallPkr / trends.length : 0;

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
          <Text style={styles.headerTitle}>{t('remittance.trends_screen_title')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trend Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryStatRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('remittance.stat_total_received')}</Text>
              <Text style={styles.statValue}>Rs. {totalOverallPkr.toLocaleString()}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>{t('remittance.stat_avg_monthly')}</Text>
              <Text style={styles.statValue}>Rs. {avgMonthlyPkr.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
            </View>
          </View>
        </Card>

        {/* Visual Trend Chart (Dot-Graph Pattern from Phase 2 / Phase 5) */}
        <Text style={styles.sectionTitle}>{t('remittance.chart_title')}</Text>

        {trends.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('remittance.no_trends_msg')}</Text>
          </Card>
        ) : (
          <Card style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {trends.map((item, index) => {
                const heightPct = Math.max(12, (item.total_pkr / maxPkr) * 100);
                return (
                  <View key={`${item.year}-${item.month}`} style={styles.barCol}>
                    <Text style={styles.barValueText}>
                      Rs. {(item.total_pkr / 1000).toFixed(0)}k
                    </Text>

                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPct}%`, backgroundColor: Colors.success },
                        ]}
                      />
                    </View>

                    <Text style={styles.barLabel}>{item.month_label}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
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
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    padding: 20,
    backgroundColor: Colors.surface,
    marginBottom: 20,
  },
  summaryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.primary,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  chartCard: {
    padding: 20,
    backgroundColor: Colors.surface,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 220,
    paddingTop: 24,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  barTrack: {
    width: 24,
    height: 140,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.sm,
  },
  barLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
});
