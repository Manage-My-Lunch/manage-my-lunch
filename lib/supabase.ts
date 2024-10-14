import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = "https://klfxguptzzjrbbeknpun.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsZnhndXB0enpqcmJiZWtucHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MjQ4MDUsImV4cCI6MjA0MTUwMDgwNX0.IWW046UbtkQBZifBTG794h-0fLfSU82XxfG_rWeLBxs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // https://github.com/supabase/supabase-js/issues/870
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
