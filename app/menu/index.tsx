import { Text, View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import React from "react";

export default function Index() {
  // Initialize the router for navigation
  const router = useRouter();

  // Sample menu items data
  const [menuItems] = useState([
    { id: '1', name: 'Sandwich', price: '$5' },
    { id: '2', name: 'Salad', price: '$7' },
    { id: '3', name: 'Pizza', price: '$8' },
  ]);
  // Render each menu item
  const renderItem = ({ item }: { item: { id: string; name: string; price: string } }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push({
        pathname: '/menu/detail',
        params: { id: item.id }
      })}
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Display the list of menu items */}
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  list: {
    paddingVertical: 20,
  },
  item: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  price: {
    fontSize: 16,
    color: "#555",
  },
});
