/**
 * WalletScreen.tsx — Main Digital Wallet screen (Phase 5).
 *
 * Shows:
 * - Large savings balance number (Design.md "Score/Number Display" typography — same treatment as credit score)
 * - Auto-save toggle and percentage input
 * - "Log income" button → navigates to LogIncomeScreen
 * - Recent transactions list (last 20)
 * - Monthly income/savings trend chart (dot-graph, same pattern as CreditScoreScreen's HistoryGraph)
 *
 * Design.md compliance:
 * - Balance in Poppins display weight, 40px+, primary colour
 * - Trend chart reuses the dot-graph pattern from CreditScoreScreen (no new charting lib)
 * - Ionicons filled icons only — no emojis
 * - All strings via i18n
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../theme/colors";
import { FontFamily, FontSize, LineHeight, MinTapTarget, Radius } from "../../theme/typography";
import { Icons } from "../../theme/icons";
import {
  getWallet,
  setAutoSave,
  getTransactions,
  getTrend,
  type WalletAccount,
  type Transaction,
  type TrendPoint,
} from "../../services/walletService";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Trend dot-graph (same pattern as CreditScoreScreen.HistoryGraph) ──────────

function TrendGraph({ data }: { data: TrendPoint[] }) {
  const { t } = useTranslation();
  const GRAPH_W = SCREEN_W - 64;
  const GRAPH_H = 100;
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.savings)), 1);
  const n = data.length;

  if (n < 2) {
    return (
      <Text style={styles.trendEmpty}>{t("wallet.no_transactions")}</Text>
    );
  }

  return (
    <View style={{ width: GRAPH_W, height: GRAPH_H + 20 }}>
      {/* Income dots (primary) */}
      {data.map((d, idx) => {
        const x = 16 + (idx / (n - 1)) * (GRAPH_W - 32);
        const y = GRAPH_H - (d.income / maxVal) * GRAPH_H;
        return (
          <View
            key={`i-${idx}`}
            style={{
              position: "absolute",
              left: x - 5,
              top: y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: Colors.primary,
              borderWidth: 2,
              borderColor: Colors.background,
            }}
          />
        );
      })}
      {/* Savings dots (success green) */}
      {data.map((d, idx) => {
        const x = 16 + (idx / (n - 1)) * (GRAPH_W - 32);
        const y = GRAPH_H - (d.savings / maxVal) * GRAPH_H;
        return (
          <View
            key={`s-${idx}`}
            style={{
              position: "absolute",
              left: x - 5,
              top: y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: Colors.success,
              borderWidth: 2,
              borderColor: Colors.background,
            }}
          />
        );
      })}
      {/* Month labels */}
      {data.map((d, idx) => {
        const x = 16 + (idx / (n - 1)) * (GRAPH_W - 32);
        const label = d.month.slice(5); // "08" from "2026-08"
        return (
          <Text
            key={`l-${idx}`}
            style={{
              position: "absolute",
              left: x - 10,
              top: GRAPH_H + 2,
              width: 20,
              textAlign: "center",
              fontFamily: FontFamily.body,
              fontSize: 10,
              color: Colors.textSecondary,
            }}
          >
            {label}
          </Text>
        );
      })}
    </View>
  );
}

// ── Transaction row ────────────────────────────────────────────────────────────

function TxnRow({ txn }: { txn: Transaction }) {
  const { t } = useTranslation();
  const isCredit = txn.type !== "income";
  const typeLabel =
    txn.type === "income"
      ? t("wallet.type_income")
      : txn.type === "auto_save"
      ? t("wallet.type_auto_save")
      : t("wallet.type_manual_save");
  const date = new Date(txn.logged_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.txnRow}>
      <View
        style={[styles.txnIcon, { backgroundColor: isCredit ? Colors.border : Colors.primaryLight }]}
      >
        <Ionicons
          name={isCredit ? Icons.wallet : Icons.income}
          size={16}
          color={isCredit ? Colors.success : Colors.primary}
        />
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnType}>{typeLabel}</Text>
        {txn.note ? <Text style={styles.txnNote}>{txn.note}</Text> : null}
        <Text style={styles.txnDate}>{date}</Text>
      </View>
      <Text style={[styles.txnAmount, isCredit && styles.txnAmountCredit]}>
        {isCredit ? "+" : ""}Rs. {txn.amount.toLocaleString()}
      </Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [wallet, setWallet] = useState<WalletAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save editing
  const [editingAutoSave, setEditingAutoSave] = useState(false);
  const [autoSaveInput, setAutoSaveInput] = useState("");
  const [savingAutoSave, setSavingAutoSave] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      setError(null);
      if (!isRefresh) setLoading(true);
      const [w, txns, tr] = await Promise.all([
        getWallet(),
        getTransactions(1, 20),
        getTrend(6),
      ]);
      setWallet(w);
      setTransactions(txns.transactions);
      setTrend(tr.data);
      setAutoSaveInput(w.auto_save_pct != null ? String(w.auto_save_pct) : "");
    } catch {
      setError(t("common.error_generic"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveAutoSave = async () => {
    setSavingAutoSave(true);
    try {
      const val = autoSaveInput.trim() === "" ? null : parseFloat(autoSaveInput);
      if (val !== null && (isNaN(val) || val < 0 || val > 100)) {
        Alert.alert(t("common.error"), "Auto-save must be between 0 and 100.");
        return;
      }
      await setAutoSave(val);
      setEditingAutoSave(false);
      loadData(true);
    } catch {
      Alert.alert(t("common.error"), t("common.error_network"));
    } finally {
      setSavingAutoSave(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name={Icons.error} size={32} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
          <Text style={styles.retryText}>{t("common.retry")}</Text>
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
          onRefresh={() => { setRefreshing(true); loadData(true); }}
          tintColor={Colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t("wallet.balance_label")}</Text>
        <Text style={styles.balanceAmount}>
          Rs. {(wallet?.balance ?? 0).toLocaleString()}
        </Text>
        <Text style={styles.balanceSub}>{t("wallet.subtitle")}</Text>
      </View>

      {/* Log income button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("LogIncome")}
      >
        <Ionicons name={Icons.income} size={18} color={Colors.surface} />
        <Text style={styles.primaryButtonText}>{t("wallet.log_income")}</Text>
      </TouchableOpacity>

      {/* Auto-save card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name={Icons.wallet} size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>{t("wallet.auto_save_label")}</Text>
          <TouchableOpacity onPress={() => setEditingAutoSave(!editingAutoSave)}>
            <Ionicons name={editingAutoSave ? Icons.close : Icons.edit} size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!editingAutoSave ? (
          <Text style={styles.autoSaveStatus}>
            {wallet?.auto_save_pct != null
              ? t("wallet.auto_save_on", { pct: wallet.auto_save_pct })
              : t("wallet.auto_save_off")}
          </Text>
        ) : (
          <View style={styles.autoSaveEdit}>
            <Text style={styles.autoSaveHint}>{t("wallet.auto_save_hint")}</Text>
            <View style={styles.autoSaveRow}>
              <TextInput
                style={styles.autoSaveInput}
                value={autoSaveInput}
                onChangeText={setAutoSaveInput}
                keyboardType="numeric"
                placeholder="e.g. 10"
                placeholderTextColor={Colors.textSecondary}
              />
              <Text style={styles.autoSavePct}>%</Text>
              <TouchableOpacity
                style={styles.autoSaveBtn}
                onPress={handleSaveAutoSave}
                disabled={savingAutoSave}
              >
                <Text style={styles.autoSaveBtnText}>{t("wallet.auto_save_set")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Trend chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("wallet.trend_title")}</Text>
        <View style={styles.trendLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendLabel}>{t("wallet.trend_income")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.legendLabel}>{t("wallet.trend_savings")}</Text>
          </View>
        </View>
        <TrendGraph data={trend} />
      </View>

      {/* Transaction list */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("wallet.transactions_title")}</Text>
        {transactions.length === 0 ? (
          <Text style={styles.trendEmpty}>{t("wallet.no_transactions")}</Text>
        ) : (
          transactions.map((txn) => <TxnRow key={txn.id} txn={txn} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, gap: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },

  // Balance card
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  balanceLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.surface + "CC",
    lineHeight: LineHeight.small,
  },
  balanceAmount: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.display,
    color: Colors.surface,
    lineHeight: FontSize.display * 1.2,
  },
  balanceSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.surface + "99",
  },

  // Buttons
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.surface,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  // Auto-save
  autoSaveStatus: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    color: Colors.textSecondary,
  },
  autoSaveEdit: { gap: 8 },
  autoSaveHint: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary },
  autoSaveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  autoSaveInput: {
    flex: 0,
    width: 72,
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  autoSavePct: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.body, color: Colors.textSecondary },
  autoSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  autoSaveBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.small,
    color: Colors.primary,
  },

  // Trend
  trendLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary },
  trendEmpty: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.textSecondary, fontStyle: "italic" },

  // Transactions
  txnRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txnIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  txnInfo: { flex: 1, gap: 2 },
  txnType: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.textPrimary },
  txnNote: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textSecondary },
  txnDate: { fontFamily: FontFamily.body, fontSize: 11, color: Colors.textSecondary },
  txnAmount: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.textPrimary },
  txnAmountCredit: { color: Colors.success },

  // Error
  errorText: { fontFamily: FontFamily.body, fontSize: FontSize.small, color: Colors.error, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: { fontFamily: FontFamily.bodyBold, fontSize: FontSize.small, color: Colors.surface },
});
