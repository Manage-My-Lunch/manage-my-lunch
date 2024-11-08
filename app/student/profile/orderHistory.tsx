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
      <Text>Edit student/profile/orderHistory.tsx to edit this screen.</Text>
    </View>
  );
}
export default withRoleProtection(Index, ["student"]);