import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";

import { listFiles, deleteFile, copyFile, DIRS, ROOT_DIR, formatSize } from "@/services/fileService";
import { FileItem } from "@/types";
import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";

const FOLDER_LABELS: Record<string, string> = {
  snippets: "Exported Snippets",
  templates: "Templates",
  attachments: "Attachments",
};

const EXT_ICONS: Record<string, string> = {
  js: "logo-javascript", ts: "logo-typescript",
  json: "code-slash", txt: "document-text",
  py: "logo-python", html: "logo-html5", css: "logo-css3",
};

export default function FileManagerScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [currentDir, setCurrentDir] = useState(ROOT_DIR);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirStack, setDirStack] = useState<string[]>([]);

  useFocusEffect(useCallback(() => { loadFiles(currentDir); }, [currentDir]));

  const loadFiles = async (dir: string) => {
    setLoading(true);
    try { setFiles(await listFiles(dir)); }
    catch { Alert.alert("Error", "Could not read folder."); }
    finally { setLoading(false); }
  };

  const navigateInto = (item: FileItem) => {
    if (!item.isDirectory) return;
    setDirStack((p) => [...p, currentDir]);
    setCurrentDir(item.uri + "/");
  };

  const navigateBack = () => {
    if (!dirStack.length) return;
    const prev = dirStack[dirStack.length - 1];
    setDirStack((s) => s.slice(0, -1));
    setCurrentDir(prev);
  };

  const handleShare = async (item: FileItem) => {
    if (!(await Sharing.isAvailableAsync())) { Alert.alert("Sharing not available"); return; }
    await Sharing.shareAsync(item.uri);
  };

  const handleDelete = (item: FileItem) => {
    Alert.alert("Delete", `Delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await deleteFile(item.uri); loadFiles(currentDir); } },
    ]);
  };

  const isRoot = currentDir === ROOT_DIR;

  const renderItem = ({ item }: { item: FileItem }) => {
    const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
    const icon = item.isDirectory ? "folder" : (EXT_ICONS[ext] ?? "document-outline");
    const iconColor = item.isDirectory ? colors.warning : colors.primary;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => item.isDirectory ? navigateInto(item) : handleShare(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconColor + "15" }]}>
          <Ionicons name={icon as any} size={19} color={iconColor} />
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.isDirectory ? (FOLDER_LABELS[item.name] ?? item.name) : item.name}
          </Text>
          {!item.isDirectory && (
            <Text style={styles.rowSize}>{formatSize(item.size)}</Text>
          )}
        </View>
        {item.isDirectory
          ? <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          : (
            <View style={styles.rowActions}>
              <TouchableOpacity onPress={() => handleShare(item)} style={styles.rowActionBtn}>
                <Ionicons name="share-outline" size={17} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.rowActionBtn}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        {!isRoot && (
          <TouchableOpacity onPress={navigateBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>STORAGE</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isRoot ? "File Manager" : (FOLDER_LABELS[currentDir.split("/").filter(Boolean).pop() ?? ""] ?? "Folder")}
          </Text>
        </View>
      </View>

      {/* Breadcrumb */}
      <Text style={styles.breadcrumb}>
        / root{!isRoot && ` / ${currentDir.replace(ROOT_DIR, "").replace(/\/$/, "")}`}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.uri}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={() => (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="folder-open-outline" size={28} color={colors.warning} />
              </View>
              <Text style={styles.emptyTitle}>Folder is empty</Text>
              <Text style={styles.emptySubtitle}>Export snippets to see files here</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center", alignItems: "center",
    marginRight: 4,
  },
  headerLabel: {
    color: colors.warning, fontSize: 10,
    fontWeight: "800", letterSpacing: 2, marginBottom: 2,
  },
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  breadcrumb: {
    color: colors.textFaint, fontSize: 12,
    paddingHorizontal: 20, marginBottom: 8,
    fontFamily: "monospace",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 11,
    justifyContent: "center", alignItems: "center",
  },
  rowMeta: { flex: 1 },
  rowName: { color: colors.text, fontSize: 15, fontWeight: "500" },
  rowSize: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: "row", gap: 4 },
  rowActionBtn: { padding: 6 },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: colors.warning + "12",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: colors.warning + "25",
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: colors.textMuted, fontSize: 14 },
});