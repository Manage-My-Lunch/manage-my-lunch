/**
 * This file provides a unified storage interface for both web and mobile environments.
 * It allows the app to use localStorage in web environments and AsyncStorage in React Native mobile environments,
 * ensuring compatibility across platforms.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = Platform.OS === "web"; // Determine if the current platform is web

// Define the storage object with methods for getting, setting, and removing items based on if web platform or not
const storage = {
  getItem: async (key) => {
    if (isWeb) {
      // Check if localStorage is available
      if (typeof localStorage !== "undefined") {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn("Error accessing localStorage", error);
          return null;
        }
      } else {
        console.warn("localStorage is not defined.");
        return null;
      }
    } else {
      return await AsyncStorage.getItem(key);
    }
  },
  setItem: async (key, value) => {
    if (isWeb) {
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.warn("Error accessing localStorage", error);
        }
      } else {
        console.warn("localStorage is not defined.");
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (isWeb) {
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn("Error accessing localStorage", error);
        }
      } else {
        console.warn("localStorage is not defined.");
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

export default storage;
