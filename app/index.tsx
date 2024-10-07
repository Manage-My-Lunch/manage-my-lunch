import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  // Initialize the router for navigation
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Login button navigates to app/login/index.tsx when clicked */}
      <Pressable style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => router.push("/register")}>
        <Text style={styles.buttonText}>Reigster</Text>
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
