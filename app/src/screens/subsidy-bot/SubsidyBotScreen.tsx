/**
 * SubsidyBotScreen.tsx — Entry point screen for Gov Subsidy & Scheme Eligibility Bot (Phase 7).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

type Props = NativeStackScreenProps<RootStackParamList, 'SubsidyBot'>;

const SCHEMES_PREVIEW = [
  {
    code: 'kissan_card',
    title: 'Punjab Kissan Card',
    title_ur: 'پنجاب کسان کارڈ',
    desc: 'Interest-free production loan up to Rs. 150,000 & crop subsidies.',
    desc_ur: '150,000 روپے تک بلا سود زرعی قرضہ اور کھاد/بیج پر سبسڈیاں۔',
    icon: Icons.insurance,
    badge: 'Punjab Gov / BOP',
  },
  {
    code: 'bisp_kafaalat',
    title: 'BISP / Benazir Kafaalat',
    title_ur: 'بینظیر کفالت پروگرام',
    desc: 'Quarterly financial grant transfer of Rs. 10,500 for eligible families.',
    desc_ur: 'مستحق خواتین کے لیے 10,500 روپے سہ ماہی کیش گرانٹ۔',
    icon: Icons.govBot,
    badge: 'BISP Federal',
  },
  {
    code: 'pm_youth_loan',
    title: 'PM Youth Business & Agri Loan',
    title_ur: 'وزیراعظم یوتھ لون اسکیم',
    desc: 'Tier-1 interest-free business loan up to Rs. 500,000 (0% mark-up).',
    desc_ur: '500,000 روپے تک 0 فیصد مارک اپ پر بلا سود قرضہ۔',
    icon: Icons.loanMatcher,
    badge: 'PMYP / SBP',
  },
];

export default function SubsidyBotScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

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
          <Text style={styles.headerTitle}>{t('subsidy_bot.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('subsidy_bot.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner Card */}
        <Card style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name={Icons.govBot} size={26} color={Colors.primary} />
            </View>
            <View style={styles.introTextContainer}>
              <Text style={styles.introTitle}>{t('subsidy_bot.intro_card_title')}</Text>
              <Text style={styles.introSub}>{t('subsidy_bot.active_schemes_count', { count: 3 })}</Text>
            </View>
          </View>
          <Text style={styles.introDesc}>{t('subsidy_bot.intro_card_desc')}</Text>
          <Button
            label={t('subsidy_bot.start_button')}
            variant="primary"
            onPress={() => navigation.navigate('QuestionFlow')}
            style={styles.startButton}
          />
        </Card>

        {/* Schemes Preview List */}
        <Text style={styles.sectionTitle}>{t('subsidy_bot.intro_card_title')}</Text>

        <View style={styles.schemeList}>
          {SCHEMES_PREVIEW.map(item => (
            <Card key={item.code} style={styles.schemeCard}>
              <View style={styles.schemeHeader}>
                <View style={styles.schemeIconCircle}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <View style={styles.schemeTitleContainer}>
                  <Text style={styles.schemeTitle}>{isUrdu ? item.title_ur : item.title}</Text>
                  <Text style={styles.schemeBadge}>{item.badge}</Text>
                </View>
              </View>
              <Text style={styles.schemeDesc}>{isUrdu ? item.desc_ur : item.desc}</Text>
            </Card>
          ))}
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
  introCard: {
    padding: 18,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  introTextContainer: {
    flex: 1,
  },
  introTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
  },
  introSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.primary,
    marginTop: 2,
  },
  introDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  startButton: {
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  schemeList: {
    gap: 12,
  },
  schemeCard: {
    padding: 14,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  schemeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
  },
  schemeBadge: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  schemeDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
