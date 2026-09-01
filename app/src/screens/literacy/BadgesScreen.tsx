/**
 * BadgesScreen.tsx — Visual Badge Showcase Screen (Phase 8).
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
import { Icons, IoniconName } from '../../theme/icons';
import { Card } from '../../components/Card';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getBadges, BadgeOut } from '../../services/literacyService';

type Props = NativeStackScreenProps<RootStackParamList, 'Badges'>;

export default function BadgesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [badges, setBadges] = useState<BadgeOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      try {
        const data = await getBadges();
        setBadges(data);
      } catch (err) {
        console.error('Failed to fetch badges', err);
      } finally {
        setLoading(false);
      }
    }
    loadBadges();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  const getBadgeIcon = (iconRef: string): IoniconName => {
    return (Icons as any)[iconRef] || Icons.badgeDefault;
  };

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
          <Text style={styles.headerTitle}>{t('literacy.badges_screen_title')}</Text>
          <Text style={styles.headerSubtitle}>
            {earnedBadges.length} of {badges.length} Unlocked
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section 1: Earned Badges */}
        <Text style={styles.sectionTitle}>{t('literacy.badges_earned_section')}</Text>
        {earnedBadges.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No badges earned yet. Complete your first lesson!</Text>
          </Card>
        ) : (
          <View style={styles.grid}>
            {earnedBadges.map(badge => {
              const name = t(`literacy.badges.${badge.badge_key}.name`);
              const desc = t(`literacy.badges.${badge.badge_key}.desc`);
              const iconName = getBadgeIcon(badge.icon_ref);
              const dateStr = badge.earned_at
                ? new Date(badge.earned_at).toLocaleDateString()
                : '';

              return (
                <Card key={badge.id} style={styles.badgeCard}>
                  <View style={styles.iconCircleEarned}>
                    <Ionicons name={iconName} size={32} color={Colors.warning} />
                  </View>
                  <Text style={styles.badgeName}>{name}</Text>
                  <Text style={styles.badgeDesc}>{desc}</Text>
                  {dateStr ? (
                    <Text style={styles.earnedDate}>
                      {t('literacy.badge_earned_on', { date: dateStr })}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}

        {/* Section 2: Locked Badges */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          {t('literacy.badges_locked_section')}
        </Text>
        <View style={styles.grid}>
          {lockedBadges.map(badge => {
            const name = t(`literacy.badges.${badge.badge_key}.name`);
            const desc = t(`literacy.badges.${badge.badge_key}.desc`);
            const iconName = getBadgeIcon(badge.icon_ref);

            return (
              <Card key={badge.id} style={[styles.badgeCard, styles.badgeCardLocked]}>
                <View style={styles.iconCircleLocked}>
                  <Ionicons name={iconName} size={28} color={Colors.textSecondary} />
                  <View style={styles.lockOverlay}>
                    <Ionicons name={Icons.lock} size={12} color={Colors.surface} />
                  </View>
                </View>
                <Text style={[styles.badgeName, styles.textLocked]}>{name}</Text>
                <Text style={[styles.badgeDesc, styles.textLocked]}>{desc}</Text>
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
    color: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  badgeCardLocked: {
    opacity: 0.6,
    backgroundColor: Colors.background,
  },
  iconCircleEarned: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.textSecondary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  earnedDate: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.success,
    marginTop: 8,
  },
  textLocked: {
    color: Colors.textSecondary,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
});
