import { Text, View, Pressable, StyleSheet, Alert } from "react-native";
import withRoleProtection from "../../components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

function Index() {
  const router = useRouter();

  // Function to handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
  
    if (error) {
      Alert.alert("Logout Error", error.message);
    } else {
      router.replace("/login");
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

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

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

export default withRoleProtection(Index, ["student"]);
