// app/snippet/[id].tsx

import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Share,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { getSnippetById, deleteSnippet, toggleFavorite } from "@/db/database";
import { getApiKey } from "@/storage/secrets";
import { Snippet } from "@/types";
import { explainSnippet } from "@/services/aiService";

export default function SnippetDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVisible, setAiVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        const found = getSnippetById(Number(id));
        setSnippet(found);
        // Reset AI panel when navigating back to this screen
        setAiVisible(false);
        setAiExplanation("");
      }
    }, [id])
  );

  if (!snippet) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textFaint} />
          <Text style={styles.notFoundText}>Snippet not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.notFoundBack, { color: colors.accent }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const langColor = colors.languages[snippet.language] ?? colors.languages.other;
  const tags = snippet.tags ? snippet.tags.split(",").filter(Boolean) : [];

  // Copy code to clipboard
  const handleCopy = async () => {
    try {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Copy failed", "expo-clipboard may not be installed.");
    }
  };

  // Share snippet
  const handleShare = async () => {
    try {
      await Share.share({
        title: snippet.title,
        message: `${snippet.title}\n\n${snippet.code}\n\nShared from DevSnippets`,
      });
    } catch (e) {
      Alert.alert("Share failed");
    }
  };

  // Toggle favorite — optimistic update
  const handleToggleFavorite = () => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippet((prev) =>
      prev ? { ...prev, isFavorite: prev.isFavorite === 1 ? 0 : 1 } : prev
    );
  };

  // Delete with confirmation
  const handleDelete = () => {
    Alert.alert(
      "Delete Snippet",
      `"${snippet.title}" will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSnippet(snippet.id);
            router.back();
          },
        },
      ]
    );
  };

  // AI Explain
const handleExplain = async () => {
  setAiVisible(true);
  setAiLoading(true);
  setAiExplanation("");

  try {
    const result = await explainSnippet(snippet.code, snippet.language, snippet.title);
    setAiExplanation(result);
  } catch (e: any) {
    setAiExplanation(e.message ?? "Failed to get explanation. Check your connection.");
  } finally {
    setAiLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleFavorite}>
            <Ionicons
              name={snippet.isFavorite === 1 ? "bookmark" : "bookmark-outline"}
              size={20}
              color={snippet.isFavorite === 1 ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(`/snippet/create?id=${snippet.id}`)}
          >
            <Ionicons name="create-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Language pill + title */}
        <View style={styles.titleSection}>
          <View style={[styles.langPill, {
            backgroundColor: langColor + "15",
            borderColor: langColor + "50",
          }]}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text style={[styles.langText, { color: langColor }]}>
              {snippet.language.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{snippet.title}</Text>
          <Text style={styles.timestamp}>
            Updated {new Date(snippet.updatedAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </Text>
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

        {/* Code block */}
        <View style={styles.codeContainer}>
          {/* Code header bar */}
          <View style={styles.codeHeader}>
            <View style={styles.trafficDots}>
              <View style={[styles.dot, { backgroundColor: "#ff5f57" }]} />
              <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
              <View style={[styles.dot, { backgroundColor: "#28c840" }]} />
            </View>
            <Text style={styles.codeHeaderLabel}>{snippet.language}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && { backgroundColor: colors.success + "25", borderColor: colors.success }]}
              onPress={handleCopy}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={14}
                color={copied ? colors.success : colors.textMuted}
              />
              <Text style={[styles.copyBtnText, copied && { color: colors.success }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actual code */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeText} selectable>
              {snippet.code}
            </Text>
          </ScrollView>
        </View>

        {/* Action buttons row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.explainBtn]}
            onPress={handleExplain}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={16} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>
              Explain with AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={16} color={colors.textMuted} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* AI Explanation panel */}
        {aiVisible && (
          <View style={styles.aiPanel}>
            <View style={styles.aiPanelHeader}>
              <View style={styles.aiPanelTitleRow}>
                <Ionicons name="sparkles" size={15} color={colors.accent} />
                <Text style={styles.aiPanelTitle}>AI Explanation</Text>
              </View>
              <TouchableOpacity onPress={() => setAiVisible(false)}>
                <Ionicons name="close" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={styles.aiLoading}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.aiLoadingText}>Analyzing your code...</Text>
              </View>
            ) : (
              <Text style={styles.aiText} selectable>
                {aiExplanation}
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    notFoundText: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
    notFoundBack: { fontSize: 14, fontWeight: "700" },

    header: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.surface, borderWidth: 1,
      borderColor: colors.border, justifyContent: "center", alignItems: "center",
    },
    headerActions: { flexDirection: "row", gap: 8 },
    iconBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.surface, borderWidth: 1,
      borderColor: colors.border, justifyContent: "center", alignItems: "center",
    },
    deleteBtn: { borderColor: colors.danger + "40", backgroundColor: colors.danger + "10" },

    scroll: { padding: 20, gap: 20 },

    titleSection: { gap: 8 },
    langPill: {
      flexDirection: "row", alignItems: "center", gap: 6,
      alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 20, borderWidth: 1,
    },
    langDot: { width: 7, height: 7, borderRadius: 4 },
    langText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    title: {
      color: colors.text, fontSize: 24,
      fontWeight: "800", letterSpacing: -0.5, lineHeight: 30,
    },
    timestamp: { color: colors.textFaint, fontSize: 12, fontWeight: "500" },

    tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: {
      backgroundColor: colors.surface, borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: colors.border,
    },
    tagText: { color: colors.textFaint, fontSize: 12, fontWeight: "600" },

    // Code block
    codeContainer: {
      backgroundColor: colors.surface, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border, overflow: "hidden",
    },
    codeHeader: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    trafficDots: { flexDirection: "row", gap: 6, marginRight: 12 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    codeHeaderLabel: {
      flex: 1, color: colors.textFaint,
      fontSize: 12, fontWeight: "600",
    },
    copyBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    copyBtnText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    codeText: {
      color: isDark ? "#e0e0e0" : "#1a1a1a",
      fontSize: 13, fontFamily: "monospace",
      lineHeight: 22, padding: 16,
    },

    // Action buttons
    actionsRow: { flexDirection: "row", gap: 10 },
    actionBtn: {
      flex: 1, flexDirection: "row", alignItems: "center",
      justifyContent: "center", gap: 7,
      backgroundColor: colors.surface, borderRadius: 12,
      paddingVertical: 13, borderWidth: 1, borderColor: colors.border,
    },
    explainBtn: {
      borderColor: colors.accent + "40",
      backgroundColor: colors.accent + "0d",
    },
    actionBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },

    // AI panel
    aiPanel: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.accent + "30",
      overflow: "hidden",
    },
    aiPanelHeader: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "center", padding: 14,
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    aiPanelTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
    aiPanelTitle: { color: colors.accent, fontSize: 13, fontWeight: "800" },
    aiLoading: {
      flexDirection: "row", alignItems: "center",
      gap: 12, padding: 20,
    },
    aiLoadingText: { color: colors.textMuted, fontSize: 14 },
    aiText: {
      color: colors.text, fontSize: 14,
      lineHeight: 22, padding: 16,
    },
  });