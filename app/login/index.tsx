import { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

/**
 * This Login page handles user authentication for the Manage My Lunch app.
 * It allows users to log in using their email and password, 
 * and routes them to different screens based on their role
 */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Function to handle user login process
  const handleLogin = async () => {
    // Attempt to sign in the user with the provided email and password using Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // If there's an error during login, display an alert with the error message
    if (error) {
      Alert.alert("Login Error", error.message);
      return;
    }

    const user = data.user;

    // Fetch user profile from Supabase to check the role
    const { data: profileData, error: profileError } = await supabase
      .from("user")
      .select("role")
      .eq("id", user?.id)
      .single();

    if (profileError) {
      Alert.alert("Error", profileError.message);
      return;
    }

    // Route user based on their role
    const role = profileData?.role;
    if (role === "student") {
      router.push("/menu");
    } else if (role === "restaurant") {
      router.push("/restaurant-home");
    } else {
      Alert.alert("Error", "Unknown role");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
        autoCapitalize="none"
      />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#00BFA6",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
