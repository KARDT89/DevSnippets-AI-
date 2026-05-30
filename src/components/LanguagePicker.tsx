import React, { useState } from "react";
import {
  View, Text, TouchableOpacity,
  Modal, FlatList, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/colors";
import { Language } from "../types";

const LANGUAGES: Language[] = [
  "javascript", "typescript", "python", "java",
  "cpp", "html", "css", "json", "bash", "other"
];

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export default function LanguagePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const langColor = Colors.languages[value] ?? Colors.languages.other;

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { borderColor: langColor }]}
        onPress={() => setOpen(true)}
      >
        <View style={[styles.dot, { backgroundColor: langColor }]} />
        <Text style={[styles.triggerText, { color: langColor }]}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color={langColor} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const color = Colors.languages[item];
                const isSelected = item === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => { onChange(item); setOpen(false); }}
                  >
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.optionText, isSelected && { color: Colors.primary }]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  sheetTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primary + "11",
  },
  optionText: {
    color: Colors.text,
    fontSize: 15,
    flex: 1,
  },
});