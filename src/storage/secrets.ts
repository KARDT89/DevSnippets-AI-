// Replace your entire secrets.ts with this:

import * as SecureStore from "expo-secure-store";

const KEYS = {
  openai: "api_key_openai",
  gemini: "api_key_gemini",
};

export const saveApiKey = async (provider: string, key: string): Promise<void> => {
  const storeKey = provider === "gemini" ? KEYS.gemini : KEYS.openai;
  await SecureStore.setItemAsync(storeKey, key);
};

export const getApiKey = async (provider: string): Promise<string | null> => {
  const storeKey = provider === "gemini" ? KEYS.gemini : KEYS.openai;
  return await SecureStore.getItemAsync(storeKey);
};

export const deleteApiKey = async (provider: string): Promise<void> => {
  const storeKey = provider === "gemini" ? KEYS.gemini : KEYS.openai;
  await SecureStore.deleteItemAsync(storeKey);
};