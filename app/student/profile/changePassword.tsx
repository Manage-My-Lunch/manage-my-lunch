import { Text, View } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";

function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit student/profile/changePassword.tsx to edit this screen.</Text>
    </View>
  );
}
export default withRoleProtection(Index, ["student"]);

//            <Pressable style={styles.changePasswordButton}>
//<Text style={styles.changePasswordText}>Set New Password</Text>
//</Pressable>