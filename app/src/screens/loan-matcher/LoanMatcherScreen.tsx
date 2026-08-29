/**
 * LoanMatcherScreen.tsx — Phase 4: Micro-Loan Eligibility Matcher.
 *
 * Shows ranked cards of loan programs the user qualifies for.
 * Each card shows: institution, program name, loan range, rate, why matched,
 * required documents, and application steps.
 *
 * Rules.md compliance: every match shows explicit why_matched reasoning.
 * No black-box output — user can see exactly why they qualified.
 */

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { getLoanMatches, type LoanProgram } from "../../services/loanService";
import { useAuthStore } from "../../store/authStore";
import type { RootStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const LOAN_TYPE_LABELS: Record<string, string> = {
  business: "Business",
  agriculture: "Agriculture",
  housing: "Housing",
  education: "Education",
  emergency: "Emergency",
};

function MatchCard({ program }: { program: LoanProgram }) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isUrdu = i18n.language === "ur";

  const appSteps = isUrdu ? program.application_steps_ur : program.application_steps_en;
  const loanRange = program.min_loan_pkr
    ? `Rs. ${program.min_loan_pkr.toLocaleString()} – ${program.max_loan_pkr.toLocaleString()}`
    : `Up to Rs. ${program.max_loan_pkr.toLocaleString()}`;

  const handleContact = () => {
    if (!program.contact_info) return;
    // Try phone first, then URL
    const phone = program.contact_info.match(/\d[\d\-]+/)?.[0];
    const url = program.contact_info.match(/https?:\/\/\S+/)?.[0];
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {});
    } else if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.institutionRow}>
          <Ionicons name={Icons.loanMatcher} size={18} color={Colors.primary} />
          <View style={styles.institutionText}>
            <Text style={styles.institutionName}>{program.institution_name}</Text>
            <Text style={styles.programName}>{program.program_name}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: Colors.primaryLight + "22" }]}>
            <Text style={styles.typeText}>{LOAN_TYPE_LABELS[program.loan_type] ?? program.loan_type}</Text>
          </View>
        </View>
      </View>

      {/* Key numbers */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name={Icons.payout} size={14} color={Colors.textSecondary} />
          <Text style={styles.statLabel}>{t("loan_matcher.match_card.max_loan")}</Text>
          <Text style={styles.statValue}>{loanRange}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name={Icons.creditScore} size={14} color={Colors.textSecondary} />
          <Text style={styles.statLabel}>{t("loan_matcher.match_card.min_score")}</Text>
          <Text style={styles.statValue}>{program.min_credit_score.toFixed(0)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rate</Text>
          <Text style={[styles.statValue, program.is_interest_free && styles.interestFree]}>
            {program.is_interest_free ? "0% (Interest-free)" : `${program.annual_rate_pct?.toFixed(0) ?? "N/A"}% p.a.`}
          </Text>
        </View>
      </View>

      {/* Why matched */}
      <View style={styles.whySection}>
        <Text style={styles.whyTitle}>{t("loan_matcher.match_card.why_matched")}</Text>
        {program.why_matched.map((reason, i) => (
          <View key={i} style={styles.whyRow}>
            <Ionicons name={Icons.success} size={14} color={Colors.success} />
            <Text style={styles.whyText}>{reason}</Text>
          </View>
        ))}
      </View>

      {/* Expand/collapse */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.expandText}>
          {expanded ? "Hide details" : "Show how to apply"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.primary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          {/* Documents */}
          <Text style={styles.sectionLabel}>{t("loan_matcher.match_card.documents_needed")}</Text>
          {program.required_documents.map((doc, i) => (
            <View key={i} style={styles.docRow}>
              <Ionicons name={Icons.document} size={14} color={Colors.textSecondary} />
              <Text style={styles.docText}>{doc}</Text>
            </View>
          ))}

          {/* Application steps */}
          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>{t("loan_matcher.match_card.how_to_apply")}</Text>
          <Text style={styles.stepsText}>{appSteps}</Text>

          {/* Contact */}
          {program.contact_info && (
            <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
              <Ionicons name={Icons.phone} size={16} color={Colors.surface} />
              <Text style={styles.contactText}>{t("loan_matcher.match_card.apply_label")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function LoanMatcherScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scoreUsed, setScoreUsed] = useState<number | null>(null);
  const [programs, setPrograms] = useState<LoanProgram[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noScore, setNoScore] = useState(false);

  const fetchMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setNoScore(false);
    try {
      const data = await getLoanMatches();
      setScoreUsed(data.credit_score_used);
      setPrograms(data.programs);
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === "NO_CREDIT_SCORE") {
        setNoScore(true);
      } else {
        setError(e?.response?.data?.message ?? t("common.error_network"));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { fetchMatches(); }, [fetchMatches]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (noScore) {
    return (
      <View style={styles.center}>
        <Ionicons name={Icons.creditScore} size={48} color={Colors.border} />
        <Text style={styles.emptyTitle}>{t("loan_matcher.no_profile")}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("CreditScore", {})}
        >
          <Text style={styles.primaryButtonText}>{t("loan_matcher.go_to_credit")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name={Icons.error} size={32} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => fetchMatches()}>
          <Text style={styles.primaryButtonText}>{t("common.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchMatches(true)}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("loan_matcher.title")}</Text>
        <Text style={styles.subtitle}>{t("loan_matcher.subtitle")}</Text>
        {scoreUsed !== null && (
          <View style={styles.scoreBadge}>
            <Ionicons name={Icons.creditScore} size={14} color={Colors.primary} />
            <Text style={styles.scoreBadgeText}>Score used: {scoreUsed}</Text>
          </View>
        )}
      </View>

      {/* Empty state */}
      {programs.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name={Icons.loanMatcher} size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t("loan_matcher.empty_title")}</Text>
          <Text style={styles.emptySubtitle}>{t("loan_matcher.empty_subtitle")}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("CreditScore", {})}
          >
            <Text style={styles.primaryButtonText}>{t("loan_matcher.go_to_credit")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match cards */}
      {programs.map((p) => (
        <MatchCard key={p.id} program={p} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 32,
    backgroundColor: Colors.background,
  },
  scroll: { padding: 16, paddingBottom: 48, gap: 16 },
  header: { gap: 4, marginBottom: 4 },
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
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary + "15",
    alignSelf: "flex-start",
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  scoreBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 12,
  },
  cardHeader: {},
  institutionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  institutionText: { flex: 1, gap: 2 },
  institutionName: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  programName: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  typeBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    color: Colors.primary,
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: 12,
    gap: 8,
  },
  statItem: { flex: 1, gap: 2, alignItems: "center" },
  statDivider: { width: 1, backgroundColor: Colors.border },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  statValue: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  interestFree: { color: Colors.success },
  whySection: { gap: 6 },
  whyTitle: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  whyRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  whyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: LineHeight.small,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  expandText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
  },
  expandedContent: { gap: 8, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  sectionLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.textPrimary,
  },
  docRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  docText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: LineHeight.small,
  },
  stepsText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    marginTop: 8,
  },
  contactText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 12 },
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
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: MinTapTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },
  errorText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.error,
    textAlign: "center",
  },
});
