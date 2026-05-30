import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Switch, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { saveApiKey, getApiKey, deleteApiKey } from "@/storage/secrets";
import { saveTheme, getTheme } from "@/storage/preferences";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsScreen() {
 
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const [saving, setSaving] = useState(false);
   const { colors, toggleTheme, isDark } = useTheme(); // ← from context


  // useEffect(() => {
  //   loadSettings();
  // }, []);

  // const loadSettings = async () => {
  //   const key = await getApiKey();
  //   setSavedKey(key);
  //   const theme = await getTheme();
  //   setIsDark(theme === "dark");
  // };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert("Empty Key", "Please enter your API key.");
      return;
    }
    setSaving(true);
    try {
      await saveApiKey(apiKey.trim());
      setSavedKey(apiKey.trim());
      setApiKey("");
      Alert.alert("Saved", "API key saved securely.");
    } catch {
      Alert.alert("Error", "Could not save API key.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = () => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your API key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteApiKey();
            setSavedKey(null);
            setApiKey("");
          },
        },
      ]
    );
  };

  // const handleThemeToggle = async (value: boolean) => {
  //   setIsDark(value);
  //   await saveTheme(value ? "dark" : "light");
  //   // Full theme switching needs a ThemeContext — we'll note this
  // };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* AI Section */}
        <Text style={styles.sectionLabel}>AI INTEGRATION</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="key-outline" size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>OpenAI API Key</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Required for AI code explanations. Stored securely on your device.
          </Text>

          {/* Show existing key status */}
          {savedKey && (
            <View style={styles.savedKeyRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.savedKeyText}>
                {showKey ? maskKey(savedKey) : "Key saved"}
              </Text>
              <TouchableOpacity onPress={() => setShowKey((v) => !v)}>
                <Ionicons
                  name={showKey ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteKey} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Input for new key */}
          <View style={styles.keyInputRow}>
            <TextInput
              style={styles.keyInput}
              placeholder={savedKey ? "Replace existing key..." : "sk-..."}
              placeholderTextColor={Colors.textFaint}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.saveKeyBtn, saving && { opacity: 0.5 }]}
              onPress={handleSaveKey}
              disabled={saving}
            >
              <Text style={styles.saveKeyBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Get your key at platform.openai.com → API Keys
          </Text>
        </View>

        {/* Appearance Section */}
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Ionicons name="moon-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Dark Mode</Text>
            </View>
            <Switch
                value={isDark}
                onValueChange={toggleTheme} // ← no argument needed
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
          </View>
          <Text style={styles.cardSubtitle}>
            Full theme switching requires app restart. Theme preference is saved.
          </Text>
        </View>

        {/* About Section */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          {[
            { icon: "code-slash-outline", label: "App", value: "DevSnippets AI" },
            { icon: "layers-outline", label: "Stack", value: "Expo + React Native" },
            { icon: "server-outline", label: "Storage", value: "SQLite + SecureStore" },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.aboutRow}>
              <Ionicons name={icon as any} size={18} color={Colors.textMuted} />
              <Text style={styles.aboutLabel}>{label}</Text>
              <Text style={styles.aboutValue}>{value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: { color: Colors.text, fontSize: 24, fontWeight: "700" },
  content: { padding: 16, gap: 8, paddingBottom: 60 },
  sectionLabel: {
    color: Colors.textFaint,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 16,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { color: Colors.text, fontSize: 15, fontWeight: "600" },
  cardSubtitle: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  savedKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.success + "15",
    padding: 10,
    borderRadius: 8,
  },
  savedKeyText: { color: Colors.success, fontSize: 13, flex: 1 },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.danger + "20",
    borderRadius: 6,
  },
  removeBtnText: { color: Colors.danger, fontSize: 12, fontWeight: "600" },
  keyInputRow: { flexDirection: "row", gap: 10 },
  keyInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
  },
  saveKeyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveKeyBtnText: { color: "#fff", fontWeight: "600" },
  hint: { color: Colors.textFaint, fontSize: 12 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { flexDirection: "row", alignItems: "center", gap: 10 },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  aboutLabel: { color: Colors.textMuted, fontSize: 14, width: 70 },
  aboutValue: { color: Colors.text, fontSize: 14, flex: 1 },
});