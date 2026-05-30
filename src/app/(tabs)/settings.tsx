// app/(tabs)/settings.tsx

import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Switch, Alert, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { getApiKey, saveApiKey, deleteApiKey } from "@/storage/secrets";
import { getAIProvider, saveAIProvider } from "@/storage/preferences";
// import { AIProvider } from "@/types";

const PROVIDERS: { key: any; label: string; model: string; color: string }[] = [
  { key: "openai", label: "ChatGPT",  model: "gpt-4o-mini",        color: "#10a37f" },
  { key: "gemini", label: "Gemini",   model: "gemini-2.0-flash",   color: "#4285f4" },
];

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors, isDark);

  const [provider, setProvider]     = useState<any>("openai");
  const [apiKey, setApiKey]         = useState("");
  const [keyInput, setKeyInput]     = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Load saved provider + key on mount and whenever provider changes
  useEffect(() => {
    const load = async () => {
      const savedProvider = (await getAIProvider()) 
      const active = savedProvider ?? "openai";
      setProvider(active);
      const key = await getApiKey(active);
      setApiKey(key ?? "");
      setKeyInput("");
    };
    load();
  }, []);

  // When user switches provider tab — load that provider's key
  const handleProviderSwitch = async (p: any) => {
    setProvider(p);
    await saveAIProvider(p);
    const key = await getApiKey(p);
    setApiKey(key ?? "");
    setKeyInput("");
    setKeyVisible(false);
  };

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSaving(true);
    await saveApiKey(provider, keyInput.trim());
    setApiKey(keyInput.trim());
    setKeyInput("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleRemoveKey = () => {
    Alert.alert(
      "Remove API Key",
      `Remove your ${PROVIDERS.find(p => p.key === provider)?.label} key?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey(provider);
            setApiKey("");
            setKeyInput("");
          },
        },
      ]
    );
  };

  const maskKey = (key: string) => {
    if (key.length < 8) return "••••••••";
    return key.slice(0, 7) + "•".repeat(Math.min(20, key.length - 7));
  };

  const activeProvider = PROVIDERS.find((p) => p.key === provider)!;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>PREFERENCES</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── APPEARANCE ── */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.cardRowLeft}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.accent + "18" }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={17} color={colors.accent} />
              </View>
              <View>
                <Text style={styles.cardRowTitle}>{isDark ? "Dark Mode" : "Light Mode"}</Text>
                <Text style={styles.cardRowSub}>
                  {isDark ? "Brutalist dark theme" : "Clean white theme"}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent + "60" }}
              thumbColor={isDark ? colors.accent : colors.textFaint}
            />
          </View>

          <View style={styles.themePreview}>
            <View style={[styles.themeChip, {
              backgroundColor: isDark ? "#000000" : "#fafafa",
              borderColor: isDark ? "#2a2a2a" : "#e8e8e8",
            }]}>
              <View style={[styles.themeChipDot, {
                backgroundColor: isDark ? "#00ff88" : "#0057ff",
              }]} />
              <Text style={[styles.themeChipText, {
                color: isDark ? "#ffffff" : "#111111",
              }]}>
                {isDark ? "Brutalist Dark" : "Clean White"}
              </Text>
            </View>
            <Text style={styles.themeHint}>Saved automatically</Text>
          </View>
        </View>

        {/* ── AI PROVIDER ── */}
        <Text style={styles.sectionLabel}>AI PROVIDER</Text>
        <View style={styles.card}>

          {/* Provider toggle tabs */}
          <View style={styles.providerTabs}>
            {PROVIDERS.map((p) => {
              const isActive = p.key === provider;
              return (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.providerTab,
                    isActive && {
                      backgroundColor: p.color + "18",
                      borderColor: p.color + "60",
                    },
                  ]}
                  onPress={() => handleProviderSwitch(p.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                  <View>
                    <Text style={[
                      styles.providerTabLabel,
                      { color: isActive ? p.color : colors.textMuted },
                    ]}>
                      {p.label}
                    </Text>
                    <Text style={styles.providerTabModel}>{p.model}</Text>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={p.color}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active provider info */}
          <View style={[styles.providerInfoRow, { borderColor: activeProvider.color + "30" }]}>
            <Ionicons name="sparkles" size={13} color={activeProvider.color} />
            <Text style={[styles.providerInfoText, { color: activeProvider.color }]}>
              Using {activeProvider.label} · {activeProvider.model}
            </Text>
          </View>
        </View>

        {/* ── API KEY ── */}
        <Text style={styles.sectionLabel}>
          {activeProvider.label.toUpperCase()} API KEY
        </Text>
        <View style={styles.card}>
          <View style={styles.cardRowLeft}>
            <View style={[styles.cardIconWrap, { backgroundColor: activeProvider.color + "18" }]}>
              <Ionicons name="key-outline" size={17} color={activeProvider.color} />
            </View>
            <View>
              <Text style={styles.cardRowTitle}>{activeProvider.label} Key</Text>
              <Text style={styles.cardRowSub}>
                {provider === "openai" ? "Starts with sk-..." : "From Google AI Studio"}
              </Text>
            </View>
          </View>

          {apiKey ? (
            <View style={styles.savedKeyRow}>
              <View style={styles.savedKeyLeft}>
                <Ionicons name="lock-closed" size={13} color={colors.success} />
                <Text style={styles.savedKeyText}>
                  {keyVisible ? apiKey : maskKey(apiKey)}
                </Text>
              </View>
              <View style={styles.savedKeyActions}>
                <TouchableOpacity
                  style={styles.keyActionBtn}
                  onPress={() => setKeyVisible(!keyVisible)}
                >
                  <Ionicons
                    name={keyVisible ? "eye-off-outline" : "eye-outline"}
                    size={15}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.keyActionBtn, {
                    backgroundColor: colors.danger + "12",
                    borderColor: colors.danger + "30",
                  }]}
                  onPress={handleRemoveKey}
                >
                  <Ionicons name="trash-outline" size={15} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noKeyRow}>
              <Ionicons name="warning-outline" size={13} color={colors.warning} />
              <Text style={styles.noKeyText}>
                No {activeProvider.label} key — AI features disabled
              </Text>
            </View>
          )}

          <View style={styles.keyInputRow}>
            <TextInput
              style={styles.keyInput}
              placeholder={provider === "openai" ? "sk-..." : "AIza..."}
              placeholderTextColor={colors.textFaint}
              value={keyInput}
              onChangeText={setKeyInput}
              secureTextEntry={!keyVisible}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[
                styles.saveKeyBtn,
                { backgroundColor: activeProvider.color },
                saved && { backgroundColor: colors.success },
                (!keyInput.trim() || saving) && { opacity: 0.5 },
              ]}
              onPress={handleSaveKey}
              disabled={!keyInput.trim() || saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={saved ? "checkmark" : "arrow-up"} size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.keyHint}>
            {provider === "openai"
              ? "Get your key at platform.openai.com/api-keys"
              : "Get your key at aistudio.google.com/apikey"}
          </Text>
        </View>

        {/* ── STORAGE ── */}
        <Text style={styles.sectionLabel}>STORAGE</Text>
        <View style={styles.card}>
          {[
            { icon: "server-outline",   label: "Snippets",    sub: "SQLite database",     color: colors.primary },
            { icon: "settings-outline", label: "Preferences", sub: "AsyncStorage",        color: colors.accent  },
            { icon: "lock-closed",      label: "API Keys",    sub: "SecureStore enclave", color: colors.success },
            { icon: "folder-outline",   label: "Files",       sub: "Expo FileSystem",     color: colors.warning },
          ].map(({ icon, label, sub, color }, i, arr) => (
            <View key={label}>
              <View style={styles.storageRow}>
                <View style={[styles.storageIcon, { backgroundColor: color + "18" }]}>
                  <Ionicons name={icon as any} size={15} color={color} />
                </View>
                <View style={styles.storageMeta}>
                  <Text style={styles.storageLabel}>{label}</Text>
                  <Text style={styles.storageSub}>{sub}</Text>
                </View>
                <View style={[styles.storageStatusDot, { backgroundColor: colors.success }]} />
              </View>
              {i < arr.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {/* ── ABOUT ── */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          {[
            { label: "App",        value: "DevSnippets AI",      color: colors.accent  },
            { label: "Version",    value: "1.0.0",               color: colors.text    },
            { label: "Built with", value: "Expo + React Native", color: colors.primary },
            { label: "AI",         value: activeProvider.label,  color: activeProvider.color },
          ].map(({ label, value, color }, i, arr) => (
            <View key={label}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>{label}</Text>
                <Text style={[styles.aboutValue, { color }]}>{value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    headerEyebrow: {
      color: colors.warning, fontSize: 10,
      fontWeight: "800", letterSpacing: 2, marginBottom: 2,
    },
    headerTitle: {
      color: colors.text, fontSize: 28,
      fontWeight: "800", letterSpacing: -0.5,
    },
    scroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 20 },
    sectionLabel: {
      color: colors.textFaint, fontSize: 10, fontWeight: "800",
      letterSpacing: 1.8, marginTop: 16, marginBottom: 6, marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
      padding: 16, gap: 14,
    },
    cardRow: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
    },
    cardRowLeft: {
      flexDirection: "row", alignItems: "center", gap: 12, flex: 1,
    },
    cardIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      justifyContent: "center", alignItems: "center",
    },
    cardRowTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
    cardRowSub: { color: colors.textMuted, fontSize: 12, marginTop: 1 },

    themePreview: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceAlt, borderRadius: 10,
      padding: 10, borderWidth: 1, borderColor: colors.border,
    },
    themeChip: {
      flexDirection: "row", alignItems: "center", gap: 7,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 20, borderWidth: 1,
    },
    themeChipDot: { width: 7, height: 7, borderRadius: 4 },
    themeChipText: { fontSize: 12, fontWeight: "700" },
    themeHint: { color: colors.textFaint, fontSize: 11, fontWeight: "500" },

    providerTabs: { gap: 8 },
    providerTab: {
      flexDirection: "row", alignItems: "center", gap: 10,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 12,
      backgroundColor: colors.surfaceAlt,
    },
    providerDot: { width: 10, height: 10, borderRadius: 5 },
    providerTabLabel: { fontSize: 14, fontWeight: "700" },
    providerTabModel: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
    providerInfoRow: {
      flexDirection: "row", alignItems: "center", gap: 7,
      borderWidth: 1, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    providerInfoText: { fontSize: 12, fontWeight: "600" },

    savedKeyRow: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.success + "10",
      borderRadius: 10, padding: 10,
      borderWidth: 1, borderColor: colors.success + "30",
    },
    savedKeyLeft: {
      flexDirection: "row", alignItems: "center", gap: 7, flex: 1,
    },
    savedKeyText: {
      color: colors.success, fontSize: 12,
      fontWeight: "600", fontFamily: "monospace", flex: 1,
    },
    savedKeyActions: { flexDirection: "row", gap: 6 },
    keyActionBtn: {
      width: 30, height: 30, borderRadius: 8,
      backgroundColor: colors.surfaceAlt, borderWidth: 1,
      borderColor: colors.border, justifyContent: "center", alignItems: "center",
    },
    noKeyRow: {
      flexDirection: "row", alignItems: "center", gap: 7,
      backgroundColor: colors.warning + "10", borderRadius: 10,
      padding: 10, borderWidth: 1, borderColor: colors.warning + "30",
    },
    noKeyText: { color: colors.warning, fontSize: 12, fontWeight: "600" },
    keyInputRow: { flexDirection: "row", gap: 8 },
    keyInput: {
      flex: 1, backgroundColor: colors.surfaceAlt,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, paddingVertical: 11,
      color: colors.text, fontSize: 13, fontFamily: "monospace",
    },
    saveKeyBtn: {
      width: 44, height: 44, borderRadius: 10,
      justifyContent: "center", alignItems: "center",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
    },
    keyHint: { color: colors.textFaint, fontSize: 11, lineHeight: 16 },

    storageRow: {
      flexDirection: "row", alignItems: "center",
      gap: 12, paddingVertical: 2,
    },
    storageIcon: {
      width: 32, height: 32, borderRadius: 9,
      justifyContent: "center", alignItems: "center",
    },
    storageMeta: { flex: 1 },
    storageLabel: { color: colors.text, fontSize: 13, fontWeight: "600" },
    storageSub: { color: colors.textFaint, fontSize: 11, marginTop: 1 },
    storageStatusDot: { width: 7, height: 7, borderRadius: 4 },
    rowDivider: {
      height: 1, backgroundColor: colors.border, marginVertical: 8,
    },
    aboutRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 2,
    },
    aboutLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
    aboutValue: { fontSize: 13, fontWeight: "700" },
  });