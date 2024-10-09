import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
    <Pressable style={styles.button} onPress={() => router.push("/forgot-password")}>
      <Text style={styles.buttonText}>Forgot Password</Text>
    </Pressable>
    <Pressable style={styles.button} onPress={() => router.push("/reset-password")}>
      <Text style={styles.buttonText}>Reset Password</Text>
    </Pressable>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#00BFA6",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});