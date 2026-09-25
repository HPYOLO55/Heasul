import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenCache = {
  async getToken(key: string) {
    if (Platform.OS === "web") return null;
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, token: string) {
    if (Platform.OS === "web") return;
    return SecureStore.setItemAsync(key, token);
  },
};
