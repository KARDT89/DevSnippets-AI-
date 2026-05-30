import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getFavoriteSnippets, toggleFavorite } from "@/db/database";
import { Snippet } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import SnippetCard from "@/components/SnippetCard";

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [snippets, setSnippets] = useState<Snippet[]>([]);

  useFocusEffect(useCallback(() => {
    setSnippets(getFavoriteSnippets());
  }, []));

  const handleToggleFavorite = (snippet: Snippet) => {
    toggleFavorite(snippet.id, snippet.isFavorite);
    setSnippets((prev) => prev.filter((s) => s.id !== snippet.id));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>COLLECTION</Text>
          <Text style={styles.headerTitle}>Favorites</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{snippets.length}</Text>
        </View>
      </View>

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
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="heart" size={28} color={colors.danger} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>Heart a snippet to save it here</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, paddingVertical: 14,
  },
  headerLabel: {
    color: colors.danger, fontSize: 10, fontWeight: "800",
    letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: { color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  countBadge: {
    backgroundColor: colors.danger + "20",
    borderWidth: 1, borderColor: colors.danger + "40",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  countText: { color: colors.danger, fontSize: 15, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 100, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.danger + "12",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.danger + "25",
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: colors.textMuted, fontSize: 14 },
});