import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();


  return (
    <View style={styles.container}>
      {/* Login button navigates to app/login/index.tsx when clicked */}
      <Pressable style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Home</Text>
      </Pressable>
      <Text>More incoming</Text>
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
    margin: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
