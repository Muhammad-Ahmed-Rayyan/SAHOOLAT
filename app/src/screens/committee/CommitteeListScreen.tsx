/**
 * CommitteeListScreen.tsx — Lists the user's committees and provides entry points
 * to create a new committee or join one via ID.
 *
 * Phase 3 — replaces the PlaceholderScreen for the Committee route.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight, MinTapTarget, Radius } from "../../theme/typography";
import { Icons } from "../../theme/icons";
import { listMyCommittees, type CommitteeListItem, type CommitteeStatus } from "../../services/committeeService";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<CommitteeStatus, string> = {
  forming: Colors.warning,
  active: Colors.success,
  completed: Colors.textSecondary,
  cancelled: Colors.error,
};

const STATUS_ICONS: Record<CommitteeStatus, string> = {
  forming: "forming",
  active: "active",
  completed: "completed",
  cancelled: "error",
};

function CommitteeCard({
  item,
  onPress,
}: {
  item: CommitteeListItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[item.status] ?? Colors.textSecondary;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons name={Icons.committee} size={18} color={Colors.primary} style={styles.cardIcon} />
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`committee.status.${item.status}`)}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name={Icons.member} size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            {item.members_count}/{item.member_limit} {t("committee.members")}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name={Icons.payout} size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            Rs. {item.contribution_amount.toLocaleString()} / {t(`committee.frequency.${item.cycle_frequency}`)}
          </Text>
        </View>
      </View>

      <Ionicons
        name={Icons.chevronRight}
        size={18}
        color={Colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

export default function CommitteeListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [committees, setCommittees] = useState<CommitteeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommittees = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await listMyCommittees();
      setCommittees(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t("common.error_network"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchCommittees();
    }, [fetchCommittees])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCommittees(true)}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("committee.title")}</Text>
          <Text style={styles.subtitle}>{t("committee.subtitle")}</Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name={Icons.error} size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Create button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateCommittee")}
          accessibilityRole="button"
        >
          <Ionicons name={Icons.addCircle} size={20} color={Colors.surface} />
          <Text style={styles.createButtonText}>{t("committee.create_new")}</Text>
        </TouchableOpacity>

        {/* Committee list */}
        {committees.length === 0 && !error ? (
          <View style={styles.emptyState}>
            <Ionicons name={Icons.committee} size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>{t("committee.empty_title")}</Text>
            <Text style={styles.emptySubtitle}>{t("committee.empty_subtitle")}</Text>
          </View>
        ) : (
          committees.map((item) => (
            <CommitteeCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate("CommitteeDetail", { committeeId: item.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.error + "15",
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.error,
    flex: 1,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: MinTapTarget,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  createButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  cardIcon: { marginTop: 1 },
  cardTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  statusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  cardMeta: { gap: 6 },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: LineHeight.small,
  },
  chevron: {
    position: "absolute",
    right: 12,
    top: "50%",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h3,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: LineHeight.small,
  },
});
