/**
 * CreditScoreScreen.tsx — Score display: number, band, factor breakdown, history graph.
 *
 * Design.md compliance:
 * - Score number in Poppins 40px+ Bold (Score/Number Display style)
 * - Band colours match success/warning/error/primary tokens from Design.md
 * - Factor bars use primaryLight for fill, border for track
 *
 * Rules.md compliance:
 * - Every score decision shows WHY (factor breakdown with % earned / max)
 * - No black-box output — each factor row is labelled in both EN and UR
 * - All strings via i18n
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  I18nManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { creditService, ScoreData, ScoreHistoryItem } from "../../services/creditService";
import { Colors } from "../../theme/colors";
import { Typography } from "../../theme/typography";
import CreditInputScreen from "./CreditInputScreen";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Score-band colour map (from Design.md status colour system) ──────────────
const BAND_COLORS: Record<string, string> = {
  excellent: Colors.success,
  good: Colors.primaryLight,
  fair: Colors.warning,
  low: Colors.accent,
  very_low: Colors.error,
};

// ── Mini bar graph component ──────────────────────────────────────────────────
function ScoreBar({ fraction }: { fraction: number }) {
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
    </View>
  );
}
const barStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    flex: 1,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
  },
});

// ── Mini history graph (simple line of dots) ──────────────────────────────────
function HistoryGraph({ history }: { history: ScoreHistoryItem[] }) {
  const { t } = useTranslation();
  if (history.length < 2) {
    return (
      <Text style={styles.historyEmpty}>{t("credit_score.history_empty")}</Text>
    );
  }

  const GRAPH_W = SCREEN_W - 64;
  const GRAPH_H = 80;
  const maxScore = 100;
  const minScore = 0;

  return (
    <View style={{ height: GRAPH_H, width: GRAPH_W }}>
      {/* Score labels along left axis */}
      {[100, 60, 20].map((v) => (
        <View
          key={v}
          style={{
            position: "absolute",
            top: GRAPH_H - (v / maxScore) * GRAPH_H - 8,
            left: 0,
          }}
        >
          <Text style={styles.graphAxisLabel}>{v}</Text>
        </View>
      ))}

      {/* Dots and connecting lines */}
      {history.map((item, idx) => {
        const x = 28 + (idx / (history.length - 1)) * (GRAPH_W - 36);
        const y = GRAPH_H - (item.score / maxScore) * GRAPH_H;
        const bandColor = BAND_COLORS[item.band] ?? Colors.primary;
        return (
          <View
            key={item.scored_at}
            style={{
              position: "absolute",
              left: x - 6,
              top: y - 6,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: bandColor,
              borderWidth: 2,
              borderColor: Colors.background,
            }}
          />
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function CreditScoreScreen() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";

  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [history, setHistory] = useState<ScoreHistoryItem[]>([]);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null); // null = loading
  const [showInput, setShowInput] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, scoreRes, historyRes] = await Promise.all([
        creditService.getProfile(),
        creditService.getLatestScore(),
        creditService.getScoreHistory(),
      ]);
      setHasProfile(profileRes !== null);
      setScoreData(scoreRes);
      setHistory(historyRes);
    } catch (e: any) {
      setError(t("common.error_generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const result = await creditService.calculateScore();
      setScoreData(result);
      const historyRes = await creditService.getScoreHistory();
      setHistory(historyRes);
    } catch (e: any) {
      setError(e.response?.data?.detail?.message ?? t("common.error_generic"));
    } finally {
      setCalculating(false);
    }
  };

  const handleInputSaved = async () => {
    setShowInput(false);
    setHasProfile(true);
    await handleCalculate();
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ── Data entry flow: no profile yet ───────────────────────────────────────
  if (!hasProfile || showInput) {
    return (
      <CreditInputScreen
        onSaved={handleInputSaved}
      />
    );
  }

  // ── Score display ──────────────────────────────────────────────────────────
  const bandColor = scoreData ? BAND_COLORS[scoreData.band] : Colors.textSecondary;
  const bandLabel = scoreData
    ? (isUrdu ? scoreData.band_label_ur : scoreData.band_label_en)
    : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* ── Score hero ─────────────────────────────────────────────── */}
      <View style={styles.heroCard}>
        {scoreData ? (
          <>
            <Text style={styles.scoreLabel}>{t("credit_score.your_score")}</Text>
            <Text style={[styles.scoreNumber, { color: bandColor }]}>
              {scoreData.score}
            </Text>
            <View style={[styles.bandBadge, { backgroundColor: bandColor + "22", borderColor: bandColor }]}>
              <Text style={[styles.bandBadgeText, { color: bandColor }]}>
                {bandLabel}
              </Text>
            </View>
            <Text style={styles.scoreDate}>
              {t("credit_score.last_updated", {
                date: new Date(scoreData.scored_at).toLocaleDateString(
                  isUrdu ? "ur-PK" : "en-PK"
                ),
              })}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.scoreLabel}>{t("credit_score.no_score_yet")}</Text>
            <Text style={styles.noScoreHint}>{t("credit_score.no_score_hint")}</Text>
          </>
        )}

        <TouchableOpacity
          style={[styles.calcBtn, calculating && styles.calcBtnDisabled]}
          onPress={handleCalculate}
          disabled={calculating}
          accessibilityRole="button"
        >
          {calculating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.calcBtnText}>
              {scoreData
                ? t("credit_score.recalculate")
                : t("credit_score.calculate")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Error banner ───────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Factor breakdown ───────────────────────────────────────── */}
      {scoreData && scoreData.factors.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("credit_score.breakdown_title")}</Text>
          <Text style={styles.cardSubtitle}>{t("credit_score.breakdown_subtitle")}</Text>

          {scoreData.factors.map((factor) => (
            <View key={factor.key} style={styles.factorRow}>
              <View style={styles.factorHeader}>
                <Text style={styles.factorLabel}>
                  {isUrdu ? factor.label_ur : factor.label_en}
                </Text>
                <Text style={styles.factorPoints}>
                  {Math.round(factor.points_earned)}/{factor.points_max}
                </Text>
              </View>
              <ScoreBar fraction={factor.fraction} />
              <Text style={styles.factorPct}>
                {Math.round(factor.fraction * 100)}%
              </Text>
            </View>
          ))}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>{t("credit_score.self_declared_note")}</Text>
          </View>
        </View>
      )}

      {/* ── Score history graph ─────────────────────────────────────── */}
      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("credit_score.history_title")}</Text>
          <Text style={styles.cardSubtitle}>
            {t("credit_score.history_subtitle", { count: history.length })}
          </Text>
          <HistoryGraph history={history} />
        </View>
      )}

      {/* ── Update data link ───────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.updateLink}
        onPress={() => setShowInput(true)}
        accessibilityRole="button"
      >
        <Text style={styles.updateLinkText}>{t("credit_score.update_data")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },

  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scoreLabel: {
    ...Typography.H3,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    lineHeight: 80,
    marginBottom: 8,
  },
  bandBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  bandBadgeText: {
    ...Typography.ButtonText,
    fontSize: 14,
  },
  scoreDate: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  noScoreHint: {
    ...Typography.Body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },

  calcBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 200,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  calcBtnDisabled: { opacity: 0.6 },
  calcBtnText: {
    ...Typography.ButtonText,
    color: "#fff",
  },

  errorBanner: {
    backgroundColor: Colors.error + "22",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.BodySmall,
    color: Colors.error,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },

  factorRow: {
    marginBottom: 16,
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  factorLabel: {
    ...Typography.Body,
    color: Colors.textPrimary,
    flex: 1,
  },
  factorPoints: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  factorPct: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: "right",
  },

  disclaimerBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontStyle: "italic",
    lineHeight: 18,
  },

  // history graph
  historyEmpty: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  graphAxisLabel: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontSize: 10,
  },

  updateLink: {
    alignItems: "center",
    paddingVertical: 16,
    minHeight: 44,
  },
  updateLinkText: {
    ...Typography.Body,
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});
