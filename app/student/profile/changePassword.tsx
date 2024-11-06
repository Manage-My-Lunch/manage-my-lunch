import { View, StyleSheet, Text, Pressable, Platform, Dimensions } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";
import { SetStateAction, useState } from "react";
import { supabase } from "@/lib/supabase";
import CustomButton from "@/components/customButton";
import { useRouter } from "expo-router";
import alert from "@/components/alert";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomTextInput from "@/components/customTextInput";

function ChangePasswordScreen() {
  const router = useRouter();
  const [existingPassword, setExistingPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if the device is mobile (small screen or on iOS/Android)
  const isMobile = Platform.OS === "ios" || Platform.OS === "android" || Dimensions.get("window").width < 768;

  const handleNewPassword = async () => {
    // Check if the passwords match
    if (newPassword !== confirmPassword) {
      alert("Cannot save new password", "Passwords don't match.");
      return;
    }

    try {
      // Re-authenticate the user with the existing password
      const { error: signInError, data: session } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email!,
        password: existingPassword
      });

      if (signInError) {
        alert("Password Update Failed", "Existing password is incorrect.");
        return;
      }

      // Attempt to update the password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // If there’s an error, show an alert
        alert("Password Update Failed", error.message);
      } else {
        // If successful, notify the user and navigate back to the profile screen
        alert("Password Updated Successfully", "Your new password has been saved.");
        router.push("/student/profile");
      }
    } catch (error) {
      alert("Unexpected Error", "Cannot save password.");
    }
  }

  return (
    <View style={styles.container}>
      {isMobile && (
        <Pressable style={styles.backButton} onPress={() => router.push("/student/profile")}>
          <Ionicons name="arrow-back-circle-outline" size={36} color="black" />
        </Pressable>
      )}

      <Text style={styles.title}>Change Password</Text>

      {/* Existing Password Input field */}
      <CustomTextInput
        placeholder="Current Password"
        value={existingPassword}
        onChangeText={(text: SetStateAction<string>) => setExistingPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      {/* New Password Input field */}
      <CustomTextInput
        placeholder="New Password"
        value={newPassword}
        onChangeText={(text: SetStateAction<string>) => setNewPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      {/* Confirm New Password Input field */}
      <CustomTextInput
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={(text: SetStateAction<string>) => setConfirmPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />

      <CustomButton
        title="Update Password"
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
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(ChangePasswordScreen, ["student"]);
