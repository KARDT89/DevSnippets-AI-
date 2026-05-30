// app/(tabs)/files.tsx

import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { useTheme } from "@/context/ThemeContext";
import { ColorScheme } from "@/constants/colors";
import {
  listFiles, deleteFile, copyFile,
  getSnippetsDir, getTemplatesDir, getAttachmentsDir,
} from "@/services/fileService";
import { FileItem } from "@/types";

const FOLDERS = [
  { key: "snippets",    label: "Snippets",    icon: "code-slash" as const, color: "#7c6aff" },
  { key: "templates",   label: "Templates",   icon: "layers"     as const, color: "#00d4ff" },
  { key: "attachments", label: "Attachments", icon: "image"      as const, color: "#00e5a0" },
];

export default function FileManagerScreen() {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);

  const [activeFolder, setActiveFolder] = useState("snippets");
  const [files, setFiles]               = useState<FileItem[]>([]);
  const [loading, setLoading]           = useState(false);

  const getDir = (folder: string) => {
    if (folder === "templates")   return getTemplatesDir();
    if (folder === "attachments") return getAttachmentsDir();
    return getSnippetsDir();
  };

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const dir = getDir(activeFolder);
      const result = await listFiles(dir);
      setFiles(result);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [activeFolder]);

  useFocusEffect(
    useCallback(() => { loadFiles(); }, [loadFiles])
  );

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const dest = getDir(activeFolder) + file.name;
      await copyFile(file.uri, dest);
      loadFiles();
    } catch {
      Alert.alert("Import failed", "Could not import the selected file.");
    }
  };

  const handleDelete = (file: FileItem) => {
    Alert.alert(
      "Delete File",
      `Delete "${file.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFile(file.uri);
            loadFiles();
          },
        },
      ]
    );
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string): React.ComponentProps<typeof Ionicons>["name"] => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) return "image-outline";
    if (["js", "ts", "jsx", "tsx"].includes(ext ?? ""))              return "logo-javascript";
    if (ext === "json")  return "code-slash-outline";
    if (ext === "txt")   return "document-text-outline";
    if (ext === "pdf")   return "document-outline";
    return "document-outline";
  };

  const activeConfig = FOLDERS.find((f) => f.key === activeFolder)!;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>LOCAL STORAGE</Text>
          <Text style={styles.headerTitle}>Files</Text>
        </View>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={handleImport}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={isDark ? "#000" : "#fff"} />
          <Text style={[styles.importBtnText, { color: isDark ? "#000" : "#fff" }]}>
            Import
          </Text>
        </TouchableOpacity>
      </View>

      {/* Folder tabs */}
      <View style={styles.folderTabs}>
        {FOLDERS.map((folder) => {
          const isActive = folder.key === activeFolder;
          return (
            <TouchableOpacity
              key={folder.key}
              style={[
                styles.folderTab,
                isActive && {
                  backgroundColor: folder.color + "18",
                  borderColor: folder.color + "60",
                },
              ]}
              onPress={() => setActiveFolder(folder.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={folder.icon}
                size={15}
                color={isActive ? folder.color : colors.textFaint}
              />
              <Text style={[
                styles.folderTabText,
                { color: isActive ? folder.color : colors.textFaint },
              ]}>
                {folder.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Current folder info bar */}
      <View style={styles.infoBar}>
        <Ionicons name={activeConfig.icon} size={13} color={activeConfig.color} />
        <Text style={[styles.infoBarText, { color: activeConfig.color }]}>
          {activeConfig.label}
        </Text>
        <Text style={styles.infoBarCount}>
          {files.length} {files.length === 1 ? "file" : "files"}
        </Text>
      </View>

      {/* File list */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.uri}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            files.length === 0
              ? styles.emptyList
              : { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 110 }
          }
          renderItem={({ item }) => (
            <View style={styles.fileRow}>
              {/* Icon */}
              <View style={[styles.fileIcon, { backgroundColor: activeConfig.color + "15" }]}>
                <Ionicons
                  name={getFileIcon(item.name)}
                  size={18}
                  color={activeConfig.color}
                />
              </View>

              {/* Name + size */}
              <View style={styles.fileMeta}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.fileSize}>{formatSize(item.size)}</Text>
              </View>

              {/* Delete */}
              <TouchableOpacity
                style={styles.fileDeleteBtn}
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="folder-open-outline" size={30} color={colors.textFaint} />
              </View>
              <Text style={styles.emptyTitle}>No files yet</Text>
              <Text style={styles.emptySubtitle}>
                Import a file or export a snippet to see it here
              </Text>
            </View>
          }
        />
      )}
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
      color: "#00e5a0",
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
    importBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 12,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    importBtnText: { fontSize: 14, fontWeight: "800" },

    folderTabs: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 12,
    },
    folderTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    folderTabText: {
      fontSize: 12,
      fontWeight: "700",
    },

    infoBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    infoBarText: {
      fontSize: 12,
      fontWeight: "700",
    },
    infoBarCount: {
      color: colors.textFaint,
      fontSize: 12,
      fontWeight: "500",
      marginLeft: "auto",
    },

    loadingWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    fileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    fileMeta: { flex: 1 },
    fileName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    fileSize: {
      color: colors.textFaint,
      fontSize: 12,
      marginTop: 2,
    },
    fileDeleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.danger + "12",
      justifyContent: "center",
      alignItems: "center",
    },

    emptyList: { flexGrow: 1 },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
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
  });