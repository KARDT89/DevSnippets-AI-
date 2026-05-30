// src/components/SnippetCard.tsx

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Snippet } from "../types";
import { useTheme } from "../context/ThemeContext";
import { ColorScheme } from "../constants/colors";

interface Props {
  snippet: Snippet;
  onPress: () => void;
  onToggleFavorite: () => void;
}

export default function SnippetCard({ snippet, onPress, onToggleFavorite }: Props) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const tags = snippet.tags ? snippet.tags.split(",").filter(Boolean) : [];
  const langColor = colors.languages[snippet.language] ?? colors.languages.other;
  const preview = snippet.code.trim().split("\n").slice(0, 2).join("\n");

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left accent bar — language color */}
      <View style={[styles.accentBar, { backgroundColor: langColor }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.langPill, { borderColor: langColor + "60", backgroundColor: langColor + "12" }]}>
            <View style={[styles.langDot, { backgroundColor: langColor }]} />
            <Text style={[styles.langText, { color: langColor }]}>
              {snippet.language}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={snippet.isFavorite === 1 ? "bookmark" : "bookmark-outline"}
              size={17}
              color={snippet.isFavorite === 1 ? colors.accent : colors.textFaint}
            />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {snippet.title}
        </Text>

        {/* Code preview block */}
        <View style={styles.codeBlock}>
          <Text style={styles.codeText} numberOfLines={2}>
            {preview}
          </Text>
        </View>

        {/* Tags row */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag.trim()}</Text>
              </View>
            ))}
            {tags.length > 3 && (
              <Text style={styles.moreText}>+{tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ColorScheme, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      overflow: "hidden",
      shadowColor: isDark ? "#000000" : "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    accentBar: {
      width: 3,
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },
    body: {
      flex: 1,
      padding: 14,
      gap: 8,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    langPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      borderWidth: 1,
    },
    langDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    langText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    codeBlock: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codeText: {
      color: colors.textMuted,
      fontSize: 11,
      fontFamily: "monospace",
      lineHeight: 17,
    },
    tagsRow: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
      alignItems: "center",
    },
    tag: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      color: colors.textFaint,
      fontSize: 10,
      fontWeight: "600",
    },
    moreText: {
      color: colors.textFaint,
      fontSize: 10,
      fontWeight: "700",
    },
  });