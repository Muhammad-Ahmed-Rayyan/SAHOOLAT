/**
 * LessonScreen.tsx — Chunked Card Viewer for Financial Literacy lessons (Phase 8).
 */

import React, { useState } from 'react';
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
import { completeLesson } from '../../services/literacyService';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export default function LessonScreen({ route, navigation }: Props) {
  const { lessonId, localeKey } = route.params;
  const { t } = useTranslation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Retrieve lesson title & cards array from locale
  const title = t(`literacy.lessons.${localeKey}.title`);
  const subtitle = t(`literacy.lessons.${localeKey}.subtitle`);
  
  // Return array of card text strings
  const cardsObject = t(`literacy.lessons.${localeKey}.cards`, { returnObjects: true });
  const cards: string[] = Array.isArray(cardsObject) ? cardsObject : [];
  const totalCards = cards.length || 1;

  const currentCardText = cards[currentIndex] || '';
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalCards - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await completeLesson(lessonId);
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to mark lesson complete', err);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((currentIndex + 1) / totalCards) * 100;

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
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            {t('literacy.card_of', { current: currentIndex + 1, total: totalCards })}
          </Text>
        </View>
      </View>

      {/* Top Card Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Main Lesson Content Card */}
        <Card style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardNumberBadge}>
              <Text style={styles.cardNumberText}>{currentIndex + 1}</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>{subtitle || title}</Text>
          </View>

          <Text style={styles.cardBodyText}>{currentCardText}</Text>
        </Card>

        {/* Action Controls */}
        {isCompleted ? (
          <Card style={styles.completedBanner}>
            <View style={styles.completedIconCircle}>
              <Ionicons name={Icons.checkmark} size={28} color={Colors.success} />
            </View>
            <Text style={styles.completedTitle}>{t('literacy.lesson_done')}</Text>
            <Button
              label={t('literacy.take_quiz')}
              variant="primary"
              onPress={() =>
                navigation.replace('Quiz', { lessonId, localeKey })
              }
              style={styles.quizButton}
            />
          </Card>
        ) : (
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navButton, isFirst && styles.navButtonDisabled]}
              onPress={handlePrev}
              disabled={isFirst}
            >
              <Ionicons
                name={Icons.back}
                size={18}
                color={isFirst ? Colors.textSecondary : Colors.textPrimary}
              />
              <Text style={[styles.navButtonText, isFirst && styles.textDisabled]}>
                {t('literacy.prev_card')}
              </Text>
            </TouchableOpacity>

            {isLast ? (
              <Button
                label={t('literacy.complete_lesson_button')}
                variant="primary"
                loading={submitting}
                onPress={handleComplete}
                style={styles.completeButton}
              />
            ) : (
              <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext}>
                <Text style={styles.navButtonPrimaryText}>{t('literacy.next_card')}</Text>
                <Ionicons name={Icons.chevronRight} size={18} color={Colors.surface} />
              </TouchableOpacity>
            )}
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
    padding: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  cardContainer: {
    padding: 24,
    minHeight: 240,
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.primary,
  },
  cardHeaderTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardBodyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  textDisabled: {
    color: Colors.textSecondary,
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    gap: 6,
  },
  navButtonPrimaryText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  completeButton: {
    flex: 1,
  },
  completedBanner: {
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  completedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completedTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  quizButton: {
    width: '100%',
  },
});
