import { TextInput, Text, View, StyleSheet, Pressable, Alert } from "react-native";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match.");
      return;
    }

    // TODO: i need to actually text this xd
    const { data, error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      alert("Error" + error.message);
    } else {
      alert("Password updated!");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reset Password</Text>

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />

      <Pressable style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>UpdatePassword</Text>
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
  input: {
    width: "80%",
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  text: {
    padding: 12,
    fontSize: 18,
  }
});