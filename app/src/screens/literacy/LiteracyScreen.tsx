/**
 * LiteracyScreen.tsx — Dashboard entry point for Gamified Financial Literacy (Phase 8).
 */

import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '../../theme/colors';
import { FontFamily, FontSize, Radius } from '../../theme/typography';
import { Icons } from '../../theme/icons';
import { Card } from '../../components/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';
import {
  getLessons,
  getProgress,
  LessonListItem,
  ProgressOut,
} from '../../services/literacyService';

type Props = NativeStackScreenProps<RootStackParamList, 'Literacy'>;

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'credit', label: 'Credit' },
  { key: 'committees', label: 'Committees' },
  { key: 'savings', label: 'Savings' },
  { key: 'loans', label: 'Loans' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'government', label: 'Gov Schemes' },
  { key: 'fraud', label: 'Fraud' },
  { key: 'budgeting', label: 'Budgeting' },
];

export default function LiteracyScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [progress, setProgress] = useState<ProgressOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = async () => {
    try {
      const [lessonsData, progressData] = await Promise.all([
        getLessons(),
        getProgress(),
      ]);
      setLessons(lessonsData);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load literacy data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredLessons = lessons.filter(lesson => {
    if (selectedCategory === 'all') return true;
    return lesson.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getLessonTitle = (key: string) => {
    const translation = t(`literacy.lessons.${key}.title`);
    return translation.includes('literacy.lessons') ? key : translation;
  };

  const getLessonSubtitle = (key: string) => {
    const translation = t(`literacy.lessons.${key}.subtitle`);
    return translation.includes('literacy.lessons') ? '' : translation;
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const completedCount = progress?.lessons_completed || 0;
  const totalLessons = progress?.total_lessons || lessons.length || 10;
  const streak = progress?.current_streak || 0;
  const badgesCount = progress?.badges_count || 0;
  const progressPct = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

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
          <Text style={styles.headerTitle}>{t('literacy.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('literacy.subtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Progress & Gamification Banner */}
        <Card style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View style={styles.progressTextCol}>
              <Text style={styles.progressLabel}>{t('literacy.progress_label')}</Text>
              <Text style={styles.completedCountText}>
                {t('literacy.lessons_completed', { count: completedCount, total: totalLessons })}
              </Text>
            </View>

            {/* Streak & Badges Pill Badges */}
            <View style={styles.statsPillGroup}>
              <View style={styles.streakPill}>
                <Ionicons name={Icons.streakFire} size={16} color={Colors.warning} />
                <Text style={styles.streakText}>{streak}d</Text>
              </View>

              <TouchableOpacity
                style={styles.badgePill}
                onPress={() => navigation.navigate('Badges')}
              >
                <Ionicons name={Icons.trophy} size={16} color={Colors.primary} />
                <Text style={styles.badgePillText}>{badgesCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progressPct))}%` }]} />
          </View>
        </Card>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lessons List */}
        <View style={styles.lessonsList}>
          {filteredLessons.map(lesson => {
            const title = getLessonTitle(lesson.locale_key);
            const subtitle = getLessonSubtitle(lesson.locale_key);

            return (
              <Card
                key={lesson.id}
                style={[styles.lessonCard, lesson.is_locked && styles.lessonCardLocked]}
              >
                <View style={styles.lessonHeaderRow}>
                  <View style={styles.sequenceBadge}>
                    <Text style={styles.sequenceText}>#{lesson.sequence_order}</Text>
                  </View>
                  <Text style={styles.categoryBadgeText}>{lesson.category.toUpperCase()}</Text>

                  <View style={styles.timeBadge}>
                    <Ionicons name={Icons.pending} size={14} color={Colors.textSecondary} />
                    <Text style={styles.timeBadgeText}>
                      {t('literacy.estimated_time', { min: lesson.estimated_minutes })}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.lessonTitle, lesson.is_locked && styles.textLocked]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.lessonSubtitle, lesson.is_locked && styles.textLocked]}>
                    {subtitle}
                  </Text>
                ) : null}

                {/* Status bar / Action */}
                <View style={styles.lessonFooterRow}>
                  {lesson.is_locked ? (
                    <View style={styles.statusLockedContainer}>
                      <Ionicons name={Icons.lock} size={16} color={Colors.textSecondary} />
                      <Text style={styles.lockedText}>{t('literacy.lesson_locked')}</Text>
                    </View>
                  ) : lesson.is_completed ? (
                    <View style={styles.statusCompletedContainer}>
                      <View style={styles.completedTag}>
                        <Ionicons name={Icons.checkmark} size={16} color={Colors.success} />
                        <Text style={styles.completedText}>{t('literacy.lesson_done')}</Text>
                      </View>
                      {lesson.quiz_score !== null && lesson.quiz_score !== undefined ? (
                        <Text style={styles.scoreText}>Quiz: {lesson.quiz_score}%</Text>
                      ) : null}
                    </View>
                  ) : (
                    <View style={styles.statusPendingContainer}>
                      <Text style={styles.pendingText}>Card {lesson.card_count} parts</Text>
                    </View>
                  )}

                  {!lesson.is_locked && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        lesson.is_completed && styles.actionButtonSecondary,
                      ]}
                      onPress={() =>
                        navigation.navigate('Lesson', {
                          lessonId: lesson.id,
                          localeKey: lesson.locale_key,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          lesson.is_completed && styles.actionButtonTextSecondary,
                        ]}
                      >
                        {lesson.is_completed ? t('literacy.continue_lesson') : t('literacy.start_lesson')}
                      </Text>
                      <Ionicons
                        name={Icons.chevronRight}
                        size={16}
                        color={lesson.is_completed ? Colors.primary : Colors.surface}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          })}
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
  headerSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  progressCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTextCol: {
    flex: 1,
  },
  progressLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  completedCountText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  statsPillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  streakText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.warning,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '25',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgePillText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    fontFamily: FontFamily.headingMedium,
    color: Colors.surface,
  },
  lessonsList: {
    gap: 12,
  },
  lessonCard: {
    padding: 16,
  },
  lessonCardLocked: {
    opacity: 0.65,
    backgroundColor: Colors.background,
  },
  lessonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sequenceBadge: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  sequenceText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  categoryBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeBadgeText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  lessonTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  lessonSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  textLocked: {
    color: Colors.textSecondary,
  },
  lessonFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border + '60',
  },
  statusLockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  statusCompletedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.success,
  },
  scoreText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  statusPendingContainer: {
    flex: 1,
  },
  pendingText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 4,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.primaryLight + '20',
  },
  actionButtonText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.small,
    color: Colors.surface,
  },
  actionButtonTextSecondary: {
    color: Colors.primary,
  },
});
