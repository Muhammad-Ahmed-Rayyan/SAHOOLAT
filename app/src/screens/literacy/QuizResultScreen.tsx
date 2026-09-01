/**
 * QuizResultScreen.tsx — Results & Explanation breakdown for Financial Literacy quizzes (Phase 8).
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

type Props = NativeStackScreenProps<RootStackParamList, 'QuizResult'>;

export default function QuizResultScreen({ route, navigation }: Props) {
  const {
    lessonId,
    localeKey,
    score,
    correctCount,
    totalQuestions,
    results,
    newlyAwardedBadges,
  } = route.params;

  const { t } = useTranslation();

  const isPerfect = score === 100;
  const isPassed = score >= 60;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('literacy.quiz_result_title')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Score Summary Banner */}
        <Card style={[styles.scoreCard, isPassed ? styles.scoreCardPass : styles.scoreCardFail]}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreNumber, isPassed ? styles.textPass : styles.textFail]}>
              {Math.round(score)}%
            </Text>
          </View>
          <Text style={styles.scoreTitle}>
            {isPerfect
              ? 'Excellent! Perfect Score!'
              : isPassed
              ? 'Great Job! Quiz Passed'
              : 'Keep Practicing!'}
          </Text>
          <Text style={styles.scoreSub}>
            {t('literacy.quiz_correct', { correct: correctCount, total: totalQuestions })}
          </Text>
        </Card>

        {/* Newly Awarded Badges Banner */}
        {newlyAwardedBadges && newlyAwardedBadges.length > 0 ? (
          <Card style={styles.badgeBannerCard}>
            <View style={styles.badgeBannerHeader}>
              <Ionicons name={Icons.trophy} size={24} color={Colors.warning} />
              <Text style={styles.badgeBannerTitle}>New Badge Unlocked!</Text>
            </View>
            <View style={styles.badgeListRow}>
              {newlyAwardedBadges.map(bKey => (
                <View key={bKey} style={styles.badgeChip}>
                  <Text style={styles.badgeChipText}>
                    {t(`literacy.badges.${bKey}.name`)}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Question-by-Question Breakdown */}
        <Text style={styles.sectionTitle}>Question Breakdown & Explanations</Text>

        <View style={styles.resultsList}>
          {results.map((res, idx) => {
            const qText = t(`literacy.lessons.${localeKey}.quiz.${res.q_key}`);
            const selectedOpt = t(
              `literacy.lessons.${localeKey}.quiz.${res.q_key}_opt${res.selected_index}`
            );
            const correctOpt = t(
              `literacy.lessons.${localeKey}.quiz.${res.q_key}_opt${res.correct_index}`
            );
            const explanation = t(
              `literacy.lessons.${localeKey}.quiz.${res.explanation_key}`
            );

            return (
              <Card key={res.q_key} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      res.is_correct ? styles.statusBadgeSuccess : styles.statusBadgeError,
                    ]}
                  >
                    <Ionicons
                      name={res.is_correct ? Icons.checkmark : Icons.error}
                      size={16}
                      color={res.is_correct ? Colors.success : Colors.error}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        res.is_correct ? styles.textSuccess : styles.textError,
                      ]}
                    >
                      Question {idx + 1}
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultQText}>{qText}</Text>

                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>{t('literacy.quiz_your_answer')}:</Text>
                  <Text
                    style={[
                      styles.answerValue,
                      res.is_correct ? styles.textSuccess : styles.textError,
                    ]}
                  >
                    {selectedOpt}
                  </Text>

                  {!res.is_correct && (
                    <View style={styles.correctAnswerBox}>
                      <Text style={styles.answerLabel}>{t('literacy.quiz_correct_answer')}:</Text>
                      <Text style={[styles.answerValue, styles.textSuccess]}>{correctOpt}</Text>
                    </View>
                  )}
                </View>

                {/* Explanation */}
                {explanation && !explanation.includes('literacy.lessons') ? (
                  <View style={styles.explanationBox}>
                    <Ionicons name={Icons.info} size={16} color={Colors.primary} />
                    <Text style={styles.explanationText}>{explanation}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footerRow}>
        <Button
          label={t('literacy.quiz_retry')}
          variant="secondary"
          onPress={() => navigation.replace('Quiz', { lessonId, localeKey })}
          style={styles.flexButton}
        />
        <Button
          label={t('literacy.quiz_next')}
          variant="primary"
          onPress={() => navigation.navigate('Literacy')}
          style={styles.flexButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  scoreCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCardPass: {
    borderColor: Colors.success + '40',
  },
  scoreCardFail: {
    borderColor: Colors.warning + '40',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
  },
  textPass: {
    color: Colors.success,
  },
  textFail: {
    color: Colors.warning,
  },
  scoreTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  scoreSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  badgeBannerCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.warning + '15',
    borderColor: Colors.warning + '40',
  },
  badgeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badgeBannerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.warning,
  },
  badgeListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  badgeChipText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeSuccess: {
    backgroundColor: Colors.success + '15',
  },
  statusBadgeError: {
    backgroundColor: Colors.error + '15',
  },
  statusText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
  },
  textSuccess: {
    color: Colors.success,
  },
  textError: {
    color: Colors.error,
  },
  resultQText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  answerBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: Radius.md,
    gap: 4,
    marginBottom: 8,
  },
  correctAnswerBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  answerLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  answerValue: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight + '15',
    padding: 12,
    borderRadius: Radius.md,
    gap: 8,
    marginTop: 4,
  },
  explanationText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
});
