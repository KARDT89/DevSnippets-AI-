import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAllSnippets, searchSnippets, toggleFavorite } from "@/db/database";
import { Snippet } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import SnippetCard from "@/components/SnippetCard";

export default function HomeScreen() {
  const { colors } = useTheme(); // ← replaces static Colors import
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => { loadSnippets(); }, [])
  );

  const loadSnippets = () => {
    const data = query.trim() ? searchSnippets(query) : getAllSnippets();
    setSnippets(data);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    setSnippets(text.trim() ? searchSnippets(text) : getAllSnippets());
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSnippets();
    setRefreshing(false);
  };

  const handleToggleFavorite = (snippet: Snippet) => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === snippet.id
          ? { ...s, isFavorite: snippet.isFavorite === 1 ? 0 : 1 }
          : s
      )
    );
  };

  const styles = makeStyles(colors); // ← rebuilt whenever theme changes

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="code-slash-outline" size={64} color={colors.textFaint} />
      <Text style={styles.emptyTitle}>No snippets yet</Text>
      <Text style={styles.emptySubtitle}>Tap the + button to save your first snippet</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DevSnippets</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/snippet/create")}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search snippets, tags, code..."
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.countText}>
        {snippets.length} snippet{snippets.length !== 1 ? "s" : ""}
      </Text>

      <FlatList
        data={snippets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SnippetCard
            snippet={item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={snippets.length === 0 ? styles.emptyList : { paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: "700" },
  addButton: {
    backgroundColor: colors.primary, width: 38, height: 38,
    borderRadius: 10, justifyContent: "center", alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.surface, marginHorizontal: 16,
    marginBottom: 12, borderRadius: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  countText: { color: colors.textFaint, fontSize: 13, marginHorizontal: 16, marginBottom: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "600" },
  emptySubtitle: {
    color: colors.textMuted, fontSize: 14,
    textAlign: "center", paddingHorizontal: 40,
  },
  emptyList: { flexGrow: 1 },
});