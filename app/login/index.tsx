import { useState } from "react";
import { View, TextInput, Text, Pressable, StyleSheet, Alert, Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import logo from '../components/logo.png';

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
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back-circle-outline" size={36} color="black" />
      </Pressable>

      <Image source={logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={24} color="gray" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={24} color="gray" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={(text) => setPassword(text)}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

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
    backgroundColor: '#F7F9FC',
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 1,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#00BFA6",
    borderRadius: 8,
    backgroundColor: '#E0F7FA',
    marginVertical: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#333',
  },
  button: {
    backgroundColor: "#00BFA6",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
