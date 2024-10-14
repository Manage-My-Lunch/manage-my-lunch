import { Text, View, Pressable, StyleSheet, Alert } from "react-native";
import withRoleProtection from "../../../components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

function Index() {
  const router = useRouter();

  // Function to handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Sign out the user from Supabase authentication

    if (error) {
      // If there's an error during logout, show an alert with the error message
      Alert.alert("Logout Error", error.message);
    } else {
      // If logout is successful, navigate to the login page
      router.replace("/login");
      Alert.alert("Successfully logged out!");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit student/profile/index.tsx to edit this screen.</Text>

      {/* Button to trigger logout */}
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

// Styling for profie page
const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#00BFA6",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(Index, ["student"]);
