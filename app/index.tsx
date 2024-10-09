import { Text, View, Button } from "react-native";
import { useRouter } from "expo-router";
import React from "react";

export default function Index() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
      <Button
        title="Menu"
        onPress={() => router.push("/menu")}
      />
    </View>
  );
}
