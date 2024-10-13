import { Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
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
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="restaurants" options={{ title: "Restaurants" }} />
      <Stack.Screen name="menu/index" options={{ title: "Menu" }} />
      <Stack.Screen
        name="menu/detail"
        options={{ title: "Menu Item Details" }}
      />
    </Stack>
  );
}