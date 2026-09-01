/**
 * QuestionFlowScreen.tsx — Progressive questionnaire flow for Gov Subsidy Bot (Phase 7).
 */

import React, { useEffect, useState } from 'react';
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
import { TextInput } from '../../components/TextInput';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  getSurveyQuestions,
  evaluateEligibility,
  SurveyQuestion,
} from '../../services/subsidyBotService';

type Props = NativeStackScreenProps<RootStackParamList, 'QuestionFlow'>;

export default function QuestionFlowScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setErrorMsg(null);
      const res = await getSurveyQuestions();
      setQuestions(res.questions);

      // Set initial answer defaults
      const defaults: Record<string, any> = {};
      res.questions.forEach(q => {
        defaults[q.id] = q.default !== undefined ? q.default : false;
      });
      setAnswers(defaults);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail?.message || t('common.error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setEvaluating(true);
    try {
      const results = await evaluateEligibility(answers);
      navigation.navigate('EligibilityResults', { evaluationData: results });
    } catch (err: any) {
      Alert.alert(t('common.error_generic'), err.response?.data?.detail?.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (errorMsg || questions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{errorMsg || 'No questions available'}</Text>
        <Button label={t('common.retry')} variant="ghost" onPress={loadQuestions} />
      </View>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPct = ((currentIndex + 1) / questions.length) * 100;
  const currentVal = answers[currentQ.id];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (currentIndex > 0 ? handlePrev() : navigation.goBack())}
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name={Icons.back} size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('subsidy_bot.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('subsidy_bot.questions.progress', { current: currentIndex + 1, total: questions.length })}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.questionCard}>
          <View style={styles.qHeader}>
            <View style={styles.qIconCircle}>
              <Ionicons name={(currentQ.icon as any) || Icons.govBot} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.questionText}>
              {isUrdu ? currentQ.text_ur : currentQ.text}
            </Text>
          </View>

          {/* Hint text if present */}
          {(currentQ.hint || currentQ.hint_ur) && (
            <View style={styles.hintBox}>
              <Ionicons name={Icons.info} size={16} color={Colors.primary} />
              <Text style={styles.hintText}>
                {isUrdu ? currentQ.hint_ur || currentQ.hint : currentQ.hint}
              </Text>
            </View>
          )}

          {/* Question Input Renderer */}
          <View style={styles.inputArea}>
            {/* 1. BOOLEAN QUESTION */}
            {currentQ.type === 'boolean' && (
              <View style={styles.booleanRow}>
                <TouchableOpacity
                  style={[
                    styles.choiceCard,
                    currentVal === true && styles.choiceCardSelected,
                  ]}
                  onPress={() => handleUpdateAnswer(currentQ.id, true)}
                >
                  <Ionicons
                    name={Icons.checkmark}
                    size={24}
                    color={currentVal === true ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.choiceText, currentVal === true && styles.choiceTextSelected]}>
                    {t('subsidy_bot.questions.yes')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choiceCard,
                    currentVal === false && styles.choiceCardSelected,
                  ]}
                  onPress={() => handleUpdateAnswer(currentQ.id, false)}
                >
                  <Ionicons
                    name={Icons.error}
                    size={24}
                    color={currentVal === false ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.choiceText, currentVal === false && styles.choiceTextSelected]}>
                    {t('subsidy_bot.questions.no')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. SELECT QUESTION */}
            {currentQ.type === 'select' && currentQ.options && (
              <View style={styles.selectColumn}>
                {currentQ.options.map(opt => {
                  const isSelected = currentVal === opt.value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.selectOption, isSelected && styles.selectOptionSelected]}
                      onPress={() => handleUpdateAnswer(currentQ.id, opt.value)}
                    >
                      <Ionicons
                        name={isSelected ? Icons.checkmark : 'ellipse-outline'}
                        size={20}
                        color={isSelected ? Colors.primary : Colors.textSecondary}
                      />
                      <Text style={[styles.selectOptionText, isSelected && styles.selectOptionTextSelected]}>
                        {isUrdu ? opt.label_ur : opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 3. NUMERIC QUESTION */}
            {currentQ.type === 'numeric' && (
              <View style={styles.numericContainer}>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const prev = parseFloat(currentVal) || 0;
                      if (prev > (currentQ.min ?? 0)) {
                        handleUpdateAnswer(currentQ.id, Math.max(0, prev - 0.5));
                      }
                    }}
                  >
                    <Ionicons name="remove" size={24} color={Colors.primary} />
                  </TouchableOpacity>

                  <View style={styles.numericValueDisplay}>
                    <Text style={styles.numericValueText}>{currentVal ?? 0} Acres</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => {
                      const prev = parseFloat(currentVal) || 0;
                      handleUpdateAnswer(currentQ.id, prev + 0.5);
                    }}
                  >
                    <Ionicons name="add" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  label="Direct Acre Input"
                  value={String(currentVal ?? 0)}
                  onChangeText={val => handleUpdateAnswer(currentQ.id, parseFloat(val) || 0)}
                  keyboardType="decimal-pad"
                  containerStyle={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {currentIndex > 0 && (
            <Button
              label={t('subsidy_bot.questions.prev')}
              variant="secondary"
              onPress={handlePrev}
              fullWidth={false}
              style={{ flex: 1, marginRight: 8 }}
            />
          )}

          <Button
            label={
              currentIndex === questions.length - 1
                ? t('subsidy_bot.questions.submit')
                : t('subsidy_bot.questions.next')
            }
            variant="primary"
            onPress={handleNext}
            loading={evaluating}
            fullWidth={false}
            style={{ flex: 2, marginLeft: currentIndex > 0 ? 8 : 0 }}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 16,
  },
  loadingText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.error,
    marginBottom: 12,
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
    fontSize: FontSize.h1,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  questionCard: {
    padding: 20,
    marginBottom: 20,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qIconCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionText: {
    flex: 1,
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '15',
    padding: 10,
    borderRadius: Radius.sm,
    marginBottom: 16,
  },
  hintText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  inputArea: {
    marginTop: 8,
  },
  booleanRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    padding: 16,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  choiceText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  choiceTextSelected: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.primary,
  },
  selectColumn: {
    gap: 10,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  selectOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  selectOptionText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginLeft: 10,
    flex: 1,
  },
  selectOptionTextSelected: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.primary,
  },
  numericContainer: {
    paddingVertical: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericValueDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  numericValueText: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.h2,
    color: Colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
