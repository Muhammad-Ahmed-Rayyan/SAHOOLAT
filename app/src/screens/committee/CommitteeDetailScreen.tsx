/**
 * CommitteeDetailScreen.tsx — Full committee view with:
 * - Member list with payout positions and payout status
 * - Current cycle info (who gets paid, due date)
 * - Transparent full contribution log
 * - Contribute button (if current cycle exists and user hasn't contributed yet)
 */

import React, { useCallback, useState } from "react";
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
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight, MinTapTarget, Radius } from "../../theme/typography";
import { Icons } from "../../theme/icons";
import {
  getCommitteeDetail,
  submitContribution,
  type CommitteeDetail,
  type CommitteeMember,
  type Contribution,
} from "../../services/committeeService";
import { useAuthStore } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "CommitteeDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MemberRow({ member, isSelf }: { member: CommitteeMember; isSelf: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.memberRow, isSelf && styles.memberRowSelf]}>
      <View style={styles.memberAvatar}>
        <Ionicons name={Icons.member} size={16} color={isSelf ? Colors.primary : Colors.textSecondary} />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {member.user_name}{isSelf ? ` (${t("committee.you")})` : ""}
        </Text>
        <Text style={styles.memberJoinOrder}>#{member.join_order} {t("committee.joined")}</Text>
      </View>
      <View style={styles.memberRight}>
        {member.payout_position != null && (
          <View style={styles.payoutBadge}>
            <Ionicons name={Icons.payout} size={12} color={member.has_received_payout ? Colors.success : Colors.textSecondary} />
            <Text style={[styles.payoutPos, member.has_received_payout && styles.payoutPosDone]}>
              #{member.payout_position}
            </Text>
          </View>
        )}
        {member.has_received_payout && (
          <Ionicons name={Icons.success} size={16} color={Colors.success} />
        )}
      </View>
    </View>
  );
}

function ContributionRow({ contrib }: { contrib: Contribution }) {
  const { t } = useTranslation();
  const dateStr = new Date(contrib.contributed_at).toLocaleDateString();
  return (
    <View style={styles.contribRow}>
      <Ionicons
        name={contrib.paid_on_time ? Icons.success : Icons.warning}
        size={16}
        color={contrib.paid_on_time ? Colors.success : Colors.warning}
      />
      <View style={styles.contribInfo}>
        <Text style={styles.contribName}>{contrib.member_name}</Text>
        <Text style={styles.contribMeta}>
          {t("committee.cycle")} {contrib.cycle_number} · {dateStr}
        </Text>
      </View>
      <Text style={styles.contribAmount}>Rs. {contrib.amount.toLocaleString()}</Text>
    </View>
  );
}

export default function CommitteeDetailScreen({ route }: Props) {
  const { committeeId } = route.params;
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [committee, setCommittee] = useState<CommitteeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getCommitteeDetail(committeeId);
      setCommittee(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? t("common.error_network"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [committeeId, t]);

  useFocusEffect(useCallback(() => { fetchDetail(); }, [fetchDetail]));

  const handleContribute = async () => {
    if (!committee?.current_cycle) return;
    const amount = committee.contribution_amount;
    Alert.alert(
      t("committee.contribute.confirm_title"),
      t("committee.contribute.confirm_body", { amount: amount.toLocaleString() }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("committee.contribute.submit"),
          onPress: async () => {
            setContributing(true);
            try {
              await submitContribution(committeeId, committee.current_cycle!.id, amount);
              fetchDetail();
            } catch (e: any) {
              const msg = e?.response?.data?.message ?? t("common.error_generic");
              Alert.alert("", msg);
            } finally {
              setContributing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !committee) {
    return (
      <View style={styles.center}>
        <Ionicons name={Icons.error} size={32} color={Colors.error} />
        <Text style={styles.errorText}>{error ?? t("common.error_generic")}</Text>
      </View>
    );
  }

  const myMember = committee.members.find((m) => m.user_id === user?.id);
  const hasContributedThisCycle = committee.contribution_log.some(
    (c) => c.member_id === myMember?.id && c.cycle_id === committee.current_cycle?.id
  );
  const canContribute =
    committee.status === "active" &&
    committee.current_cycle != null &&
    myMember != null &&
    !hasContributedThisCycle;

  const statusColor =
    committee.status === "active"
      ? Colors.success
      : committee.status === "forming"
      ? Colors.warning
      : Colors.textSecondary;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDetail(true)}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Committee header */}
      <View style={styles.committeeHeader}>
        <Text style={styles.committeeName}>{committee.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {t(`committee.status.${committee.status}`)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name={Icons.payout} size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              Rs. {committee.contribution_amount.toLocaleString()} / {t(`committee.frequency.${committee.cycle_frequency}`)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name={Icons.member} size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {committee.members.length}/{committee.member_limit} {t("committee.members")}
            </Text>
          </View>
        </View>
      </View>

      {/* Current cycle */}
      {committee.current_cycle && (
        <SectionCard title={t("committee.current_cycle")}>
          <View style={styles.cycleCard}>
            <View style={styles.cycleRow}>
              <Ionicons name={Icons.cycle} size={16} color={Colors.primary} />
              <Text style={styles.cycleTitle}>
                {t("committee.cycle")} {committee.current_cycle.cycle_number}
              </Text>
            </View>
            <View style={styles.cycleRow}>
              <Ionicons name={Icons.payout} size={14} color={Colors.textSecondary} />
              <Text style={styles.cycleInfo}>
                {t("committee.payout_to")}: <Text style={styles.cycleHighlight}>{committee.current_cycle.payout_member_name}</Text>
              </Text>
            </View>
            <View style={styles.cycleRow}>
              <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
              <Text style={styles.cycleInfo}>
                {t("committee.due")}: {new Date(committee.current_cycle.due_date).toLocaleDateString()}
              </Text>
            </View>

            {canContribute && (
              <TouchableOpacity
                style={styles.contributeButton}
                onPress={handleContribute}
                disabled={contributing}
              >
                {contributing ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <>
                    <Ionicons name={Icons.contribution} size={18} color={Colors.surface} />
                    <Text style={styles.contributeText}>
                      {t("committee.contribute.button", { amount: committee.contribution_amount.toLocaleString() })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {!canContribute && myMember && committee.status === "active" && (
              <View style={styles.paidBadge}>
                <Ionicons name={Icons.success} size={16} color={Colors.success} />
                <Text style={styles.paidText}>{t("committee.contribute.already_paid")}</Text>
              </View>
            )}
          </View>
        </SectionCard>
      )}

      {/* Members */}
      <SectionCard title={t("committee.members_section")}>
        {committee.members.map((m) => (
          <MemberRow key={m.id} member={m} isSelf={m.user_id === user?.id} />
        ))}
        {committee.status === "forming" && (
          <Text style={styles.formingNote}>
            {t("committee.forming_note", { remaining: committee.member_limit - committee.members.length })}
          </Text>
        )}
      </SectionCard>

      {/* Contribution log */}
      <SectionCard title={t("committee.contribution_log")}>
        {committee.contribution_log.length === 0 ? (
          <Text style={styles.emptyLog}>{t("committee.no_contributions_yet")}</Text>
        ) : (
          committee.contribution_log.map((c) => (
            <ContributionRow key={c.id} contrib={c} />
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  committeeHeader: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 10,
  },
  committeeName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    color: Colors.textPrimary,
    lineHeight: LineHeight.h2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    textTransform: "capitalize",
  },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 4 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cycleCard: { gap: 8 },
  cycleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cycleTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  cycleInfo: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary },
  cycleHighlight: { color: Colors.primary, fontFamily: FontFamily.bodyBold },
  contributeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    marginTop: 8,
  },
  contributeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success + "15",
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 8,
  },
  paidText: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.success },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberRowSelf: { backgroundColor: Colors.primary + "08", borderRadius: Radius.sm, paddingHorizontal: 6 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: { flex: 1 },
  memberName: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.textPrimary },
  memberJoinOrder: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textSecondary },
  memberRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  payoutBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  payoutPos: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary },
  payoutPosDone: { color: Colors.success },
  formingNote: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.warning,
    fontStyle: "italic",
  },
  contribRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contribInfo: { flex: 1 },
  contribName: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.textPrimary },
  contribMeta: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textSecondary },
  contribAmount: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.textPrimary },
  emptyLog: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary, fontStyle: "italic" },
  errorText: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.error, textAlign: "center" },
});
