/**
 * EligibilityResultsScreen.tsx — Results screen displaying scheme eligibility (Phase 7).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
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
import { EvaluationResultData } from '../../services/subsidyBotService';

type Props = NativeStackScreenProps<RootStackParamList, 'EligibilityResults'>;

export default function EligibilityResultsScreen({ route, navigation }: Props) {
  const { evaluationData } = route.params;
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'eligible':
        return Colors.success;
      case 'partially_eligible':
        return Colors.warning;
      case 'not_eligible':
        return Colors.error;
      default:
        return Colors.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'eligible':
        return Icons.checkmark;
      case 'partially_eligible':
        return Icons.warning;
      case 'not_eligible':
        return Icons.error;
      default:
        return Icons.info;
    }
  };

  const openUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Dashboard')}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={Icons.back} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('subsidy_bot.results.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('subsidy_bot.results.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner summary */}
        <Card style={styles.summaryBanner}>
          <Ionicons name={Icons.shield} size={24} color={Colors.primary} />
          <Text style={styles.summaryBannerText}>
            {t('subsidy_bot.results.eligible_count_banner', {
              count: evaluationData.eligible_count,
              total: evaluationData.total_evaluated,
            })}
          </Text>
        </Card>

        {/* Results Cards List */}
        <View style={styles.resultsList}>
          {evaluationData.results.map((res: EvaluationResultData) => {
            const statusColor = getStatusColor(res.status);
            const statusIcon = getStatusIcon(res.status);
            const passedList = isUrdu ? res.passed_criteria_ur : res.passed_criteria;
            const failedList = isUrdu ? res.failed_criteria_ur : res.failed_criteria;
            const stepsList = isUrdu ? res.application_steps_ur : res.application_steps;
            const reasonText = isUrdu ? res.reason_summary_ur : res.reason_summary;

            return (
              <Card key={res.scheme_id} style={styles.resultCard}>
                {/* Scheme Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleArea}>
                    <Text style={styles.schemeTitle}>{isUrdu ? res.title_ur : res.title}</Text>
                    <Text style={styles.providerBadge}>{res.provider}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={statusIcon} size={14} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {t(`subsidy_bot.results.status.${res.status}`)}
                    </Text>
                  </View>
                </View>

                {/* Plain language explanation */}
                <View style={[styles.reasonBox, { borderLeftColor: statusColor }]}>
                  <Text style={styles.reasonText}>{reasonText}</Text>
                </View>

                {/* Passed Criteria List */}
                {passedList && passedList.length > 0 && (
                  <View style={styles.criteriaSection}>
                    <Text style={styles.criteriaHeader}>{t('subsidy_bot.results.passed_criteria')}</Text>
                    {passedList.map((item, idx) => (
                      <View key={idx} style={styles.criteriaItem}>
                        <Ionicons name={Icons.checkmark} size={16} color={Colors.success} />
                        <Text style={styles.criteriaItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Failed Criteria List */}
                {failedList && failedList.length > 0 && (
                  <View style={styles.criteriaSection}>
                    <Text style={[styles.criteriaHeader, { color: Colors.error }]}>
                      {t('subsidy_bot.results.failed_criteria')}
                    </Text>
                    {failedList.map((item, idx) => (
                      <View key={idx} style={styles.criteriaItem}>
                        <Ionicons name={Icons.error} size={16} color={Colors.error} />
                        <Text style={styles.criteriaItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Application Steps & SMS Codes */}
                <View style={styles.stepsSection}>
                  <Text style={styles.sectionHeader}>{t('subsidy_bot.results.how_to_apply')}</Text>

                  {res.sms_service_code && (
                    <View style={styles.smsBox}>
                      <Ionicons name={Icons.phone} size={18} color={Colors.primary} />
                      <Text style={styles.smsText}>
                        {t('subsidy_bot.results.sms_code_label')}:{' '}
                        <Text style={styles.smsCode}>{res.sms_service_code}</Text>
                      </Text>
                    </View>
                  )}

                  {stepsList && stepsList.map((step, sIdx) => (
                    <View key={sIdx} style={styles.stepItem}>
                      <View style={styles.stepNumberCircle}>
                        <Text style={styles.stepNumberText}>{sIdx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Source Citation Footer */}
                <View style={styles.citationBox}>
                  <View style={styles.citationHeader}>
                    <Ionicons name={Icons.citation} size={14} color={Colors.textSecondary} />
                    <Text style={styles.citationTitle}>{t('subsidy_bot.results.source_citation')}</Text>
                  </View>
                  <Text style={styles.citationBody}>{res.source_citation}</Text>

                  {res.official_portal_url && (
                    <TouchableOpacity
                      style={styles.portalLinkBtn}
                      onPress={() => openUrl(res.official_portal_url)}
                    >
                      <Text style={styles.portalLinkText}>{t('subsidy_bot.results.official_portal')}</Text>
                      <Ionicons name={Icons.citation} size={12} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            label={t('subsidy_bot.results.recheck')}
            variant="secondary"
            onPress={() => navigation.navigate('QuestionFlow')}
            fullWidth={false}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label={t('subsidy_bot.results.back_home')}
            variant="primary"
            onPress={() => navigation.navigate('Dashboard')}
            fullWidth={false}
            style={{ flex: 1, marginLeft: 8 }}
          />
        </View>
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.primaryLight + '20',
    marginBottom: 16,
  },
  summaryBannerText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.primary,
    marginLeft: 10,
    flex: 1,
  },
  resultsList: {
    gap: 16,
    marginBottom: 20,
  },
  resultCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  schemeTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
  },
  providerBadge: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    marginLeft: 4,
  },
  reasonBox: {
    borderLeftWidth: 3,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radius.sm,
    marginBottom: 12,
  },
  reasonText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  criteriaSection: {
    marginBottom: 12,
  },
  criteriaHeader: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaItemText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginLeft: 6,
    flex: 1,
  },
  stepsSection: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  sectionHeader: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  smsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '25',
    padding: 10,
    borderRadius: Radius.sm,
    marginBottom: 10,
  },
  smsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  smsCode: {
    fontFamily: FontFamily.headingBold,
    color: Colors.primary,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumberCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  stepNumberText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.background,
  },
  stepText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  citationBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  citationTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  citationBody: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  portalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  portalLinkText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    color: Colors.primary,
    marginRight: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
