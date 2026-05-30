import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { insertSnippet, getSnippetById, updateSnippet } from "@/db/database";
import { Language } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import LanguagePicker from "@/components/LanguagePicker";
import TagInput from "@/components/TagInput";
import { getApiKey } from "@/storage/secrets";

export default function CreateSnippetScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // AI Generate state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const snippet = getSnippetById(Number(id));
      if (snippet) {
        setTitle(snippet.title);
        setCode(snippet.code);
        setLanguage(snippet.language as Language);
        setTags(snippet.tags ? snippet.tags.split(",").filter(Boolean) : []);
      }
    }
  }, [id]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert("Missing Title", "Please add a title."); return; }
    if (!code.trim()) { Alert.alert("Missing Code", "Please add some code."); return; }
    setSaving(true);
    const now = new Date().toISOString();
    try {
      if (isEditMode) {
        const existing = getSnippetById(Number(id))!;
        updateSnippet({ ...existing, title: title.trim(), code: code.trim(), language, tags: tags.join(","), updatedAt: now });
      } else {
        insertSnippet({ title: title.trim(), code: code.trim(), language, tags: tags.join(","), isFavorite: 0, attachmentPath: null, createdAt: now, updatedAt: now });
      }
      router.back();
    } catch {
      Alert.alert("Error", "Could not save snippet.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!title && !code && tags.length === 0) { router.back(); return; }
    Alert.alert("Discard?", "Unsaved changes will be lost.", [
      { text: "Keep Editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Describe your snippet", "Tell the AI what code you want to generate.");
      return;
    }
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("No API Key", "Add your OpenAI API key in Settings first.");
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "user",
              content: `Generate a ${language} code snippet for: ${aiPrompt.trim()}

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "title": "short descriptive title",
  "code": "the complete code here",
  "tags": ["tag1", "tag2", "tag3"]
}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const text = data.choices[0].message.content;
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setTitle(parsed.title ?? "");
      setCode(parsed.code ?? "");
      setTags(Array.isArray(parsed.tags) ? parsed.tags : []);
      setShowAiPanel(false);
      setAiPrompt("");
    } catch (e: any) {
      Alert.alert("Generation Failed", e.message ?? "Something went wrong.");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleDiscard} style={styles.headerIconBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? "Edit Snippet" : "New Snippet"}</Text>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

          {/* AI Generate Panel */}
          <TouchableOpacity
            style={styles.aiToggleBtn}
            onPress={() => setShowAiPanel((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.aiToggleLeft}>
              <View style={styles.aiIcon}>
                <Ionicons name="sparkles" size={15} color={colors.primary} />
              </View>
              <Text style={styles.aiToggleText}>Generate with AI</Text>
            </View>
            <Ionicons
              name={showAiPanel ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showAiPanel && (
            <View style={styles.aiPanel}>
              <Text style={styles.aiPanelLabel}>Describe what you need</Text>
              <TextInput
                style={styles.aiInput}
                placeholder={`e.g. "debounce hook in ${language}" or "fetch with retry logic"`}
                placeholderTextColor={colors.textFaint}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
                numberOfLines={3}
              />
              <View style={styles.aiPanelFooter}>
                <Text style={styles.aiHint}>
                  Will generate for: <Text style={{ color: colors.primary }}>{language}</Text>
                </Text>
                <TouchableOpacity
                  style={[styles.generateBtn, aiGenerating && { opacity: 0.6 }]}
                  onPress={handleAiGenerate}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={15} color="#fff" />
                      <Text style={styles.generateBtnText}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
              maxLength={80}
            />
          </View>

          {/* Language */}
          <View style={styles.field}>
            <Text style={styles.label}>LANGUAGE</Text>
            <LanguagePicker value={language} onChange={setLanguage} />
          </View>

          {/* Code */}
          <View style={styles.field}>
            <Text style={styles.label}>CODE</Text>
            <TextInput
              style={styles.codeInput}
              placeholder={"// paste or generate your code here"}
              placeholderTextColor={colors.textFaint}
              value={code}
              onChangeText={setCode}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>

          {/* Tags */}
          <View style={styles.field}>
            <Text style={styles.label}>TAGS</Text>
            <TagInput tags={tags} onChange={setTags} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 10, minWidth: 64, alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  form: { padding: 16, gap: 20, paddingBottom: 80 },
  aiToggleBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary + "12",
    borderWidth: 1, borderColor: colors.primary + "35",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  aiToggleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primary + "25",
    justifyContent: "center", alignItems: "center",
  },
  aiToggleText: { color: colors.text, fontSize: 14, fontWeight: "600" },
  aiPanel: {
    backgroundColor: colors.surface,
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.primary + "25",
    gap: 12, marginTop: -8,
  },
  aiPanelLabel: {
    color: colors.textMuted, fontSize: 12,
    fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase",
  },
  aiInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12,
    color: colors.text, fontSize: 14,
    minHeight: 80, textAlignVertical: "top",
    lineHeight: 20,
  },
  aiPanelFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiHint: { color: colors.textFaint, fontSize: 12 },
  generateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 5,
  },
  generateBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  field: { gap: 8 },
  label: {
    color: colors.textFaint, fontSize: 11,
    fontWeight: "800", letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, color: colors.text,
    fontSize: 15,
  },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, color: colors.text,
    fontSize: 13, fontFamily: "monospace",
    minHeight: 220, textAlignVertical: "top",
    lineHeight: 20,
  },
});