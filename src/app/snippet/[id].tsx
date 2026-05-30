import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Share,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSnippetById, deleteSnippet, toggleFavorite } from "@/db/database";
import { explainSnippet, AIResult } from "@/services/aiService";
import { exportSnippet } from "@/services/exportService";
import { Snippet } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";

export default function SnippetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [exportVisible, setExportVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const data = getSnippetById(Number(id));
      if (!data) { router.back(); return; }
      setSnippet(data);
    }, [id])
  );

  if (!snippet) return null;

  const tags = snippet.tags ? snippet.tags.split(",").filter(Boolean) : [];
  const langColor = colors.languages[snippet.language] ?? colors.languages.other;

  const handleToggleFavorite = () => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippet((s) => s ? { ...s, isFavorite: s.isFavorite === 1 ? 0 : 1 } : s);
  };

  const handleDelete = () => {
    Alert.alert("Delete Snippet", `Delete "${snippet.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { deleteSnippet(snippet.id); router.back(); } },
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({ title: snippet.title, message: `// ${snippet.title}\n// ${snippet.language}\n\n${snippet.code}` });
    } catch { Alert.alert("Error", "Could not share."); }
  };

  const handleExport = async (format: "txt" | "js" | "ts" | "py" | "json") => {
    setExportVisible(false);
    try {
      await exportSnippet(snippet, format);
    } catch { Alert.alert("Export Failed", "Could not export snippet."); }
  };

  const handleExplain = async () => {
    setAiResult(null);
    setAiError(null);
    setAiLoading(true);
    try {
      const result = await explainSnippet(snippet.code, snippet.language);
      setAiResult(result);
    } catch (e: any) {
      setAiError(e.message === "NO_API_KEY"
        ? "No API key. Add your OpenAI key in Settings."
        : e.message ?? "Something went wrong.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconBtn}>
            <Ionicons
              name={snippet.isFavorite === 1 ? "heart" : "heart-outline"}
              size={20}
              color={snippet.isFavorite === 1 ? colors.danger : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/snippet/create?id=${snippet.id}`)} style={styles.iconBtn}>
            <Ionicons name="pencil-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.langBadge, { backgroundColor: langColor + "18", borderColor: langColor + "40" }]}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text style={[styles.langText, { color: langColor }]}>{snippet.language}</Text>
          </View>
          <Text style={styles.title}>{snippet.title}</Text>
          <Text style={styles.date}>{new Date(snippet.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</Text>
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Code Block */}
        <View style={styles.codeBlock}>
          <View style={styles.codeBlockHeader}>
            <View style={styles.trafficLights}>
              <View style={[styles.dot, { backgroundColor: "#ff5f57" }]} />
              <View style={[styles.dot, { backgroundColor: "#febc2e" }]} />
              <View style={[styles.dot, { backgroundColor: "#28c840" }]} />
            </View>
            <Text style={styles.codeBlockLang}>{snippet.language}</Text>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="copy-outline" size={16} color={colors.textFaint} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.code}>{snippet.code}</Text>
          </ScrollView>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setExportVisible((v) => !v)}>
            <Ionicons name="download-outline" size={17} color={colors.primary} />
            <Text style={styles.actionBtnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={17} color={colors.primary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.explainBtn, aiLoading && { opacity: 0.7 }]}
            onPress={handleExplain}
            disabled={aiLoading}
          >
            <Ionicons name="sparkles" size={17} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>
              {aiLoading ? "Thinking..." : "Explain"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export Formats */}
        {exportVisible && (
          <View style={styles.exportPanel}>
            <Text style={styles.exportLabel}>EXPORT AS</Text>
            <View style={styles.exportFormats}>
              {(["txt", "js", "ts", "py", "json"] as const).map((fmt) => (
                <TouchableOpacity key={fmt} style={styles.exportFmt} onPress={() => handleExport(fmt)}>
                  <Text style={styles.exportFmtText}>.{fmt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AI States */}
        {aiLoading && (
          <View style={styles.aiCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.aiLoadingText}>Analyzing your code...</Text>
          </View>
        )}

        {aiError && (
          <View style={[styles.aiCard, { borderColor: colors.warning + "40", backgroundColor: colors.warning + "08" }]}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={[styles.aiLoadingText, { color: colors.warning }]}>{aiError}</Text>
          </View>
        )}

        {aiResult && (
          <View style={styles.aiResultCard}>
            <View style={styles.aiResultHeader}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={styles.aiResultTitle}>AI Analysis</Text>
            </View>
            {[
              { label: "SUMMARY", value: aiResult.summary },
              { label: "EXPLANATION", value: aiResult.explanation },
              { label: "SUGGESTIONS", value: aiResult.suggestions },
            ].map(({ label, value }, i) => (
              <View key={label}>
                {i > 0 && <View style={styles.aiDivider} />}
                <View style={styles.aiSection}>
                  <Text style={styles.aiSectionLabel}>{label}</Text>
                  <Text style={styles.aiSectionText}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerRight: { flexDirection: "row", gap: 2 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  hero: { gap: 8 },
  langBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: "flex-start",
  },
  langDot: { width: 7, height: 7, borderRadius: 4 },
  langText: { fontSize: 12, fontWeight: "700" },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5, lineHeight: 30 },
  date: { color: colors.textFaint, fontSize: 13 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: colors.primary + "18",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  codeBlock: {
    backgroundColor: colors.surface,
    borderRadius: 16, borderWidth: 1,
    borderColor: colors.border, overflow: "hidden",
  },
  codeBlockHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 8,
  },
  trafficLights: { flexDirection: "row", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  codeBlockLang: { color: colors.textFaint, fontSize: 12, fontWeight: "600", flex: 1 },
  code: {
    color: colors.text, fontFamily: "monospace",
    fontSize: 13, padding: 16, lineHeight: 22,
  },
  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: colors.surface, borderRadius: 12,
    paddingVertical: 13, borderWidth: 1, borderColor: colors.border,
  },
  explainBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  actionBtnText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  exportPanel: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  exportLabel: {
    color: colors.textFaint, fontSize: 11,
    fontWeight: "800", letterSpacing: 1.2,
  },
  exportFormats: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  exportFmt: {
    backgroundColor: colors.surfaceAlt, paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  exportFmtText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  aiCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, backgroundColor: colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
  },
  aiLoadingText: { color: colors.textMuted, fontSize: 14 },
  aiResultCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.primary + "30", overflow: "hidden",
  },
  aiResultHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, backgroundColor: colors.primary + "10",
    borderBottomWidth: 1, borderBottomColor: colors.primary + "20",
  },
  aiResultTitle: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  aiDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
  aiSection: { padding: 14, gap: 6 },
  aiSectionLabel: {
    color: colors.textFaint, fontSize: 11,
    fontWeight: "800", letterSpacing: 1.2,
  },
  aiSectionText: { color: colors.text, fontSize: 14, lineHeight: 20 }})