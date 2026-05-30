import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppPreferences } from "../types";

const KEYS = {
  THEME: "pref_theme",
  SORT_BY: "pref_sort_by",
  aiProvider: "ai_provider",
};

export const saveTheme = async (theme: AppPreferences["theme"]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.THEME, theme);
};

export const getTheme = async (): Promise<AppPreferences["theme"]> => {
  const value = await AsyncStorage.getItem(KEYS.THEME);
  return (value as AppPreferences["theme"]) ?? "dark";
};

export const saveSortBy = async (sort: AppPreferences["sortBy"]): Promise<void> => {
  await AsyncStorage.setItem(KEYS.SORT_BY, sort);
};

export const getSortBy = async (): Promise<AppPreferences["sortBy"]> => {
  const value = await AsyncStorage.getItem(KEYS.SORT_BY);
  return (value as AppPreferences["sortBy"]) ?? "createdAt";
};

export const saveAIProvider = async (provider: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.aiProvider, provider);
};

export const getAIProvider = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(KEYS.aiProvider);
};