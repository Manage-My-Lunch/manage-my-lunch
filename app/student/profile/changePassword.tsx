import { View, StyleSheet, TextInput, Alert } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import CustomButton from "@/components/customButton";
import { useRouter } from "expo-router";

function ChangePasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNewPassword = async () => {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match.");
      return;
    }

    try {
      // Attempt to update the password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // If there’s an error, show an alert
        Alert.alert("Password Update Failed", error.message);
      } else {
        // If successful, notify the user and navigate back to the profile screen
        Alert.alert("Password Updated Successfully");
        router.push("/student/profile");
      }
    } catch (error) {
      Alert.alert("Unexpected Error");
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your new Password"
        value={newPassword}
        onChangeText={(text) => setNewPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm your new Password"
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />

      <CustomButton
        title="Save"
        onPress={handleNewPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "80%",
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(ChangePasswordScreen, ["student"]);
