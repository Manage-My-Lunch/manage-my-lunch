// from https://stackoverflow.com/questions/65481226/react-native-alert-alert-only-works-on-ios-and-android-not-web
import { Alert, Platform } from "react-native";

const alertPolyfill = (
  title: string,
  description: string,
  options: Array<{
    text: string;
    onPress: () => void;
    style?: string;
  }> = [{ text: "OK", onPress: () => {} }] // Default option to dismiss
) => {
  const result = window.confirm(
    [title, description].filter(Boolean).join("\n")
  );

  if (result) {
    const confirmOption = options.find(({ style }) => style !== "cancel");
    confirmOption && confirmOption.onPress();
  } else {
    const cancelOption = options.find(({ style }) => style === "cancel");
    cancelOption && cancelOption.onPress();
  }
};

// Use the polyfill for web and the native Alert for other platforms
const alert = Platform.OS === "web" ? alertPolyfill : Alert.alert;

export default alert;
