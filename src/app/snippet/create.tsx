// app/snippet/create.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator, Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { insertSnippet, updateSnippet, getSnippetById } from "@/db/database";
import { getApiKey } from "@/storage/secrets";
import { Snippet, Language } from "@/types";
import { generateSnippet } from "@/services/aiService";

const LANGUAGES: Language[] = [
  "javascript", "typescript", "python", "java",
  "cpp", "html", "css", "json", "bash", "other",
];

export default function CreateSnippetScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  // Form state
  const [title, setTitle]       = useState("");
  const [code, setCode]         = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [tags, setTags]         = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving]     = useState(false);

  // AI panel state
  const [aiOpen, setAiOpen]       = useState(false);
  const [aiPrompt, setAiPrompt]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Language picker state
  const [langOpen, setLangOpen] = useState(false);

  // Load snippet if editing
  useEffect(() => {
    if (isEdit && id) {
      const snippet = getSnippetById(Number(id));
      if (snippet) {
        setTitle(snippet.title);
        setCode(snippet.code);
        setLanguage(snippet.language as Language);
        setTags(snippet.tags);
      }
    }
  }, [id]);

  // Slide AI panel open/close
  const toggleAiPanel = () => {
    if (aiOpen) {
      Animated.timing(slideAnim, {
        toValue: 0, duration: 260,
        useNativeDriver: true,
      }).start(() => setAiOpen(false));
    } else {
      setAiOpen(true);
      Animated.timing(slideAnim, {
        toValue: 1, duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  // AI generation

const handleGenerate = async () => {
  if (!aiPrompt.trim()) return;
  setAiLoading(true);
  setAiError("");

  try {
    const result = await generateSnippet(aiPrompt);
    setTitle(result.title ?? "");
    setCode(result.code ?? "");
    setTags(result.tags ?? "");
    if (LANGUAGES.includes(result.language as Language)) {
      setLanguage(result.language as Language);
    }
    toggleAiPanel();
  } catch (e: any) {
    setAiError(e.message ?? "Generation failed. Check your API key.");
  } finally {
    setAiLoading(false);
  }
};

  // Tag helpers
  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t) return;
    const existing = tags ? tags.split(",").filter(Boolean) : [];
    if (!existing.includes(t)) {
      setTags([...existing, t].join(","));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.split(",").filter((t) => t !== tag).join(","));
  };

  // Save
  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Title required", "Give your snippet a title."); return; }
    if (!code.trim())  { Alert.alert("Code required", "Add some code first.");        return; }

    setSaving(true);
    const now = new Date().toISOString();

    if (isEdit && id) {
      const existing = getSnippetById(Number(id));
      if (existing) {
        updateSnippet({ ...existing, title: title.trim(), code, language, tags, updatedAt: now });
      }
    } else {
      insertSnippet({
        title: title.trim(), code, language, tags,
        isFavorite: 0, attachmentPath: null,
        createdAt: now, updatedAt: now,
      });
    }

    setSaving(false);
    router.back();
  };

  const tagList = tags ? tags.split(",").filter(Boolean) : [];
  const langColor = colors.languages[language] ?? colors.languages.other;
  const panelTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? "Edit Snippet" : "New Snippet"}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={isDark ? "#000" : "#fff"} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* AI Generate button */}
          <TouchableOpacity style={styles.aiBtn} onPress={toggleAiPanel} activeOpacity={0.8}>
            <View style={styles.aiBtnLeft}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.aiBtnText}>Generate with AI</Text>
            </View>
            <Ionicons
              name={aiOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textFaint}
            />
          </TouchableOpacity>

          {/* AI Panel — slides in */}
          {aiOpen && (
            <Animated.View
              style={[styles.aiPanel, { transform: [{ translateY: panelTranslate }] }]}
            >
              <Text style={styles.aiPanelLabel}>DESCRIBE YOUR SNIPPET</Text>
              <TextInput
                style={styles.aiInput}
                placeholder="e.g. A React hook that debounces a value by 300ms"
                placeholderTextColor={colors.textFaint}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                numberOfLines={3}
                autoFocus
              />
              {aiError ? (
                <Text style={styles.aiError}>{aiError}</Text>
              ) : null}
              <TouchableOpacity
                style={[styles.aiGenerateBtn, aiLoading && { opacity: 0.6 }]}
                onPress={handleGenerate}
                disabled={aiLoading}
                activeOpacity={0.8}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="flash" size={15} color="#000" />
                    <Text style={styles.aiGenerateBtnText}>Generate Snippet</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Debounce Hook"
              placeholderTextColor={colors.textFaint}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="words"
            />
          </View>

          {/* Language picker */}
          <View style={styles.field}>
            <Text style={styles.label}>LANGUAGE</Text>
            <TouchableOpacity
              style={[styles.langTrigger, { borderColor: langColor + "60" }]}
              onPress={() => setLangOpen(!langOpen)}
              activeOpacity={0.8}
            >
              <View style={[styles.langDot, { backgroundColor: langColor }]} />
              <Text style={[styles.langTriggerText, { color: langColor }]}>{language}</Text>
              <Ionicons name={langOpen ? "chevron-up" : "chevron-down"} size={15} color={langColor} />
            </TouchableOpacity>

            {langOpen && (
              <View style={styles.langGrid}>
                {LANGUAGES.map((lang) => {
                  const lc = colors.languages[lang];
                  const isActive = lang === language;
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.langOption,
                        isActive && { backgroundColor: lc + "20", borderColor: lc },
                      ]}
                      onPress={() => { setLanguage(lang); setLangOpen(false); }}
                    >
                      <View style={[styles.langDot, { backgroundColor: lc }]} />
                      <Text style={[styles.langOptionText, { color: isActive ? lc : colors.textMuted }]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Code input */}
          <View style={styles.field}>
            <Text style={styles.label}>CODE</Text>
            <View style={styles.codeWrap}>
              {/* macOS-style traffic dots */}
              <View style={styles.codeDots}>
                <View style={[styles.dot, { backgroundColor: "#ff5f57" }]} />
                <View style={[styles.dot, { backgroundColor: "#ffbd2e" }]} />
                <View style={[styles.dot, { backgroundColor: "#28c840" }]} />
                <Text style={styles.codeLangLabel}>{language}</Text>
              </View>
              <TextInput
                style={styles.codeInput}
                placeholder={"// paste your code here"}
                placeholderTextColor={colors.textFaint}
                value={code}
                onChangeText={setCode}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.field}>
            <Text style={styles.label}>TAGS</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.textFaint}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.tagAddBtn} onPress={addTag}>
                <Ionicons name="add" size={18} color={isDark ? "#000" : "#fff"} />
              </TouchableOpacity>
            </View>
            {tagList.length > 0 && (
              <View style={styles.tagList}>
                {tagList.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagPill}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagPillText}>#{tag}</Text>
                    <Ionicons name="close" size={12} color={colors.accent} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 12,
      gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.surface, borderWidth: 1,
      borderColor: colors.border, justifyContent: "center", alignItems: "center",
    },
    headerTitle: {
      flex: 1, color: colors.text,
      fontSize: 17, fontWeight: "700",
    },
    saveBtn: {
      backgroundColor: colors.accent, paddingHorizontal: 18,
      paddingVertical: 9, borderRadius: 10,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    saveBtnText: {
      color: isDark ? "#000000" : "#ffffff",
      fontWeight: "800", fontSize: 14,
    },

    scroll: { padding: 16, gap: 20 },

    // AI
    aiBtn: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface, borderRadius: 12,
      padding: 14, borderWidth: 1,
      borderColor: colors.accent + "40",
    },
    aiBtnLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    aiBtnText: { color: colors.accent, fontWeight: "700", fontSize: 14 },

    aiPanel: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.accent + "30",
      gap: 12,
    },
    aiPanelLabel: {
      color: colors.accent, fontSize: 10,
      fontWeight: "800", letterSpacing: 1.5,
    },
    aiInput: {
      backgroundColor: colors.surface, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border,
      padding: 12, color: colors.text,
      fontSize: 14, lineHeight: 20,
      minHeight: 80, textAlignVertical: "top",
    },
    aiError: { color: colors.danger, fontSize: 12, fontWeight: "600" },
    aiGenerateBtn: {
      backgroundColor: colors.accent, borderRadius: 10,
      padding: 13, flexDirection: "row",
      alignItems: "center", justifyContent: "center", gap: 8,
    },
    aiGenerateBtnText: {
      color: "#000000", fontWeight: "800", fontSize: 14,
    },

    // Fields
    field: { gap: 8 },
    label: {
      color: colors.textFaint, fontSize: 10,
      fontWeight: "800", letterSpacing: 1.5,
    },
    input: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 13,
      color: colors.text, fontSize: 15, fontWeight: "500",
    },

    // Language
    langTrigger: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.surface, borderRadius: 10,
      borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11,
      alignSelf: "flex-start",
    },
    langTriggerText: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
    langDot: { width: 8, height: 8, borderRadius: 4 },
    langGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 8,
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, padding: 12,
    },
    langOption: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 10, paddingVertical: 7,
      borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    },
    langOptionText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },

    // Code block
    codeWrap: {
      backgroundColor: colors.surface,
      borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      overflow: "hidden",
    },
    codeDots: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    dot: { width: 10, height: 10, borderRadius: 5 },
    codeLangLabel: {
      color: colors.textFaint, fontSize: 11,
      fontWeight: "600", marginLeft: "auto",
    },
    codeInput: {
      color: colors.text, fontSize: 13,
      fontFamily: "monospace", padding: 14,
      minHeight: 180, textAlignVertical: "top",
      lineHeight: 20,
    },

    // Tags
    tagInputRow: { flexDirection: "row", gap: 8 },
    tagInput: {
      flex: 1, backgroundColor: colors.surface,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 11,
      color: colors.text, fontSize: 14,
    },
    tagAddBtn: {
      width: 44, height: 44, borderRadius: 10,
      backgroundColor: colors.accent,
      justifyContent: "center", alignItems: "center",
    },
    tagList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tagPill: {
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.accent + "40",
    },
    tagPillText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  });