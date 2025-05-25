import { TextInput, Text, View, StyleSheet, Pressable } from "react-native";
import alert from "@/components/alert";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const [email, setEmail] = useState("");

  const handleConfirmForget = async () => {
    let { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      /* TODO: FIX THIS REDIRECT SO IT IS FLEXIBLE */
      redirectTo: 'http://localhost:8081/reset-password',
    })
    if (error) {
      alert("Error", error.message);
    } else {
      alert(
        `"Recovery instructions sent to ${email}."`,
        "If an account exists for this email, you'll receive a password reset email."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Forgot your Password?</Text>

      <TextInput
        style={styles.input}
        placeholder="name@email.com"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Pressable style={styles.button} onPress={handleConfirmForget}>
        <Text style={styles.buttonText}>Send Recovery Email</Text>
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