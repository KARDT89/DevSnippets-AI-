import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Snippet } from "../types";
import { Colors } from "../constants/colors";

interface Props {
  snippet: Snippet;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export default function SnippetCard({ snippet, onPress, onToggleFavorite }: Props) {
  const tags = snippet.tags ? snippet.tags.split(",").filter(Boolean) : [];
  const langColor = Colors.languages[snippet.language] ?? Colors.languages.other;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{snippet.title}</Text>
        <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={snippet.isFavorite === 1 ? "heart" : "heart-outline"}
            size={20}
            color={snippet.isFavorite === 1 ? Colors.danger : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Code preview */}
      <Text style={styles.codePreview} numberOfLines={2}>
        {snippet.code}
      </Text>

      {/* Footer row */}
      <View style={styles.footerRow}>
        {/* Language badge */}
        <View style={[styles.langBadge, { backgroundColor: langColor + "22", borderColor: langColor }]}>
          <Text style={[styles.langText, { color: langColor }]}>{snippet.language}</Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag.trim()}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  codePreview: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  langText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: Colors.textFaint,
    fontSize: 11,
  },
});