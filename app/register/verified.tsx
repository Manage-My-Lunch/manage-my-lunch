import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Verified() {
  return (
    <View>
      <Text style={{ textAlign: "center" }}>Email Verified</Text>
      <Link
        href="/login"
        style={{
          textAlign: "center",
          textDecorationLine: "underline",
          color: "#00f",
        }}
      >
        Login now!
      </Link>
    </View>
  );
}
