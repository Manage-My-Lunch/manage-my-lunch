import { Text, View } from "react-native";
import withRoleProtection from "../../components/withRoleProtection";

function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit restaurant/index.tsx to edit this screen.</Text>
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(Index, ["restaurant"]);
