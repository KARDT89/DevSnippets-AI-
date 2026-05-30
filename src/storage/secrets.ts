import * as SecureStore from "expo-secure-store";

const KEYS = {
  AI_API_KEY: "ai_api_key",
};

export const saveApiKey = async (key: string): Promise<void> => {
  await SecureStore.setItemAsync(KEYS.AI_API_KEY, key);
};

export const getApiKey = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(KEYS.AI_API_KEY);
};

export const deleteApiKey = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(KEYS.AI_API_KEY);
};