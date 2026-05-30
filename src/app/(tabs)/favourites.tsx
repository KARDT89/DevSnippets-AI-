// app/(tabs)/favorites.tsx

import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList,
  StyleSheet, TouchableOpacity,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import { getFavoriteSnippets, toggleFavorite } from "@/db/database";
import { Snippet } from "@/types";
import SnippetCard from "@/components/SnippetCard";

export default function FavoritesScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useFocusEffect(
    useCallback(() => {
      setSnippets(getFavoriteSnippets());
    }, [])
  );

  const handleToggleFavorite = (snippet: Snippet) => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    // Remove from list instantly — it's no longer a favorite
    setSnippets((prev) => prev.filter((s) => s.id !== snippet.id));
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="bookmark-outline" size={30} color={colors.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>No saved snippets</Text>
      <Text style={styles.emptySubtitle}>
        Tap the bookmark icon on any snippet to save it here
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push("/")}
        activeOpacity={0.8}
      >
        <Text style={[styles.emptyBtnText, { color: isDark ? "#000" : "#fff" }]}>
          Browse Snippets
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>COLLECTION</Text>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        {snippets.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{snippets.length}</Text>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* List */}
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
        contentContainerStyle={
          snippets.length === 0
            ? styles.emptyList
            : { paddingTop: 12, paddingBottom: 110 }
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    headerEyebrow: {
      color: colors.danger,
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
    countBadge: {
      backgroundColor: colors.danger + "18",
      borderWidth: 1,
      borderColor: colors.danger + "40",
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    countBadgeText: {
      color: colors.danger,
      fontSize: 13,
      fontWeight: "800",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginBottom: 4,
    },

    emptyList: { flexGrow: 1 },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyIconWrap: {
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
    emptyBtn: {
      marginTop: 8,
      backgroundColor: colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    emptyBtnText: {
      fontSize: 14,
      fontWeight: "800",
    },
  });