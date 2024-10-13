import React from 'react';
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }} />
      <Stack.Screen name="menu/index" options={{ title: "Menu" }} />
      <Stack.Screen
        name="menu/detail"
        options={{ title: "Menu Item Details" }}
      />
    </Stack>
  );
}
