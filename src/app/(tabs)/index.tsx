// app/(tabs)/index.tsx

import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { getAllSnippets, searchSnippets, toggleFavorite } from "@/db/database";
import { Snippet } from "@/types";
import SnippetCard from "@/components/SnippetCard";

const FILTERS = ["all", "javascript", "typescript", "python", "java", "cpp", "html", "css", "bash", "other"];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);

  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    const raw = query.trim() ? searchSnippets(query) : getAllSnippets();
    const filtered =
      activeFilter === "all"
        ? raw
        : raw.filter((s) => s.language === activeFilter);
    setSnippets(filtered);
  }, [query, activeFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSearch = (text: string) => {
    setQuery(text);
    const raw = text.trim() ? searchSnippets(text) : getAllSnippets();
    const filtered =
      activeFilter === "all" ? raw : raw.filter((s) => s.language === activeFilter);
    setSnippets(filtered);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    const raw = query.trim() ? searchSnippets(query) : getAllSnippets();
    const filtered = filter === "all" ? raw : raw.filter((s) => s.language === filter);
    setSnippets(filtered);
  };

  const handleToggleFavorite = (snippet: Snippet) => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippets((prev) =>
      prev.map((s) =>
        s.id === snippet.id ? { ...s, isFavorite: s.isFavorite === 1 ? 0 : 1 } : s
      )
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    load();
    setRefreshing(false);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="code-slash" size={32} color={colors.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>No snippets yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to save your first code snippet
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>YOUR LIBRARY</Text>
          <Text style={styles.headerTitle}>Snippets</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/snippet/create")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={isDark ? "#000000" : "#ffffff"} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textFaint} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search snippets, tags, code..."
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.textFaint} />
          </TouchableOpacity>
        )}
      </View>

      {/* Language filter chips */}
      <FlatList
        data={FILTERS}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isActive = item === activeFilter;
          const langColor = item === "all" ? colors.accent : (colors.languages[item] ?? colors.textFaint);
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                isActive && {
                  backgroundColor: langColor + "20",
                  borderColor: langColor,
                },
              ]}
              onPress={() => handleFilter(item)}
              activeOpacity={0.7}
            >
              {item !== "all" && (
                <View style={[styles.filterDot, { backgroundColor: langColor }]} />
              )}
              <Text style={[
                styles.filterText,
                { color: isActive ? langColor : colors.textFaint },
              ]}>
                {item === "all" ? "All" : item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Count bar */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {snippets.length} {snippets.length === 1 ? "snippet" : "snippets"}
        </Text>
        {activeFilter !== "all" && (
          <TouchableOpacity onPress={() => handleFilter("all")}>
            <Text style={[styles.clearFilter, { color: colors.accent }]}>
              Clear filter
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Snippet list */}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={
          snippets.length === 0
            ? styles.emptyList
            : { paddingBottom: 110, paddingTop: 4 }
        }
        showsVerticalScrollIndicator={false}
      />

    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerEyebrow: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: 2,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    filterList: {
      paddingHorizontal: 16,
      gap: 8,
      paddingBottom: 4,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    filterText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    countRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    countText: {
      color: colors.textFaint,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    clearFilter: {
      fontSize: 12,
      fontWeight: "700",
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 4,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700",
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: "center",
      paddingHorizontal: 48,
      lineHeight: 20,
    },
    emptyList: { flexGrow: 1 },
  });