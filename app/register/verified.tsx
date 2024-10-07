import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Verified() {
  return (
    <View>
      <Text>Email Verified</Text>
      <Link href="/login">Login now!</Link>
    </View>
  );
}
