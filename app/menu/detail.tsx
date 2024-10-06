import { Text, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function MenuItemDetail() {
  const { id } = useLocalSearchParams();

  const menuItem = {
    id,
    name: "Sample Item",
    description: "This is a detailed description of the menu item.",
    price: "$10",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{menuItem.name}</Text>
      <Text style={styles.price}>{menuItem.price}</Text>
      <Text style={styles.description}>{menuItem.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  price: {
    fontSize: 24,
    color: "#00BFA6",
    marginVertical: 10,
  },
  description: {
    fontSize: 18,
    color: "#555",
  },
});
