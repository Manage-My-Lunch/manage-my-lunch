import { Stack } from "expo-router";
import React from "react";

export default function MenuLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#00BFA6",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Menu" }} />
      <Stack.Screen
        name="detail"
        options={{ title: "Menu Item Details" }}
      />
    </Stack>
  );
}
