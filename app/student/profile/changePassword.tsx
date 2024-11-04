import { View, StyleSheet, TextInput, Pressable, Platform, Dimensions } from "react-native";
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

      {/* New Password Input field */}
      <CustomTextInput
        placeholder="Enter your new Password"
        value={newPassword}
        onChangeText={(text: SetStateAction<string>) => setNewPassword(text)}
        secureTextEntry={true}
        autoCapitalize="none"
      />
      {/* Confirm New Password Input field */}
      <CustomTextInput
        placeholder="Confirm your new Password"
        value={confirmPassword}
        onChangeText={(text: SetStateAction<string>) => setConfirmPassword(text)}
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
});

// Protect the component with role-based access for students
export default withRoleProtection(ChangePasswordScreen, ["student"]);
