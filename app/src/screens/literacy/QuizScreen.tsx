/**
 * QuizScreen.tsx — Progressive Quiz flow for Financial Literacy (Phase 8).
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
import { getQuiz, submitQuiz, QuizQuestion } from '../../services/literacyService';

type Props = NativeStackScreenProps<RootStackParamList, 'Quiz'>;

export default function QuizScreen({ route, navigation }: Props) {
  const { lessonId, localeKey } = route.params;
  const { t } = useTranslation();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    async function loadQuiz() {
      try {
        const quizData = await getQuiz(lessonId);
        setQuestions(quizData.questions);
      } catch (err) {
        console.error('Failed to load quiz', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [lessonId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>No questions available for this quiz.</Text>
        <Button label={t('common.back')} variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const qText = t(`literacy.lessons.${localeKey}.quiz.${currentQ.q_key}`);
  
  // Options
  const options = [];
  for (let i = 0; i < currentQ.options_count; i++) {
    const optText = t(`literacy.lessons.${localeKey}.quiz.${currentQ.q_key}_opt${i}`);
    options.push({ index: i, text: optText });
  }

  const selectedOptionIndex = selectedAnswers[currentIndex];
  const isSelected = selectedOptionIndex !== undefined;

  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (index: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: index }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => selectedAnswers[i] ?? 0);
      const result = await submitQuiz(lessonId, answersArray);
      
      navigation.replace('QuizResult', {
        lessonId,
        localeKey,
        score: result.score,
        correctCount: result.correct_count,
        totalQuestions: result.total_questions,
        results: result.results,
        streak: result.streak,
        newlyAwardedBadges: result.newly_awarded_badges,
      });
    } catch (err) {
      console.error('Failed to submit quiz', err);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((currentIndex + 1) / totalQuestions) * 100;

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
          <Text style={styles.headerTitle}>{t('literacy.quiz_title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('literacy.quiz_question_of', { current: currentIndex + 1, total: totalQuestions })}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionText}>{qText}</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {options.map(opt => {
              const active = selectedOptionIndex === opt.index;
              return (
                <TouchableOpacity
                  key={opt.index}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => handleSelectOption(opt.index)}
                >
                  <View style={[styles.radioButton, active && styles.radioButtonActive]}>
                    {active ? <View style={styles.radioButtonInner} /> : null}
                  </View>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {isLastQuestion ? (
          <Button
            label={t('literacy.quiz_submit')}
            variant="primary"
            disabled={!isSelected || submitting}
            loading={submitting}
            onPress={handleSubmit}
            style={styles.actionButton}
          />
        ) : (
          <Button
            label={t('common.next')}
            variant="primary"
            disabled={!isSelected}
            onPress={handleNext}
            style={styles.actionButton}
          />
        )}
      </View>
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
    padding: 24,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.error,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
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
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCard: {
    padding: 20,
    backgroundColor: Colors.surface,
  },
  questionText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonActive: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    fontFamily: FontFamily.headingMedium,
    color: Colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    width: '100%',
  },
});
