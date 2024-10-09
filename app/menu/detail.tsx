import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";

// Define the possible option keys dynamically
type OptionKeys = string;

export default function MenuItemDetail() {
  const { item } = useLocalSearchParams();
  const menuItem = item ? JSON.parse(item as string) : null;

  if (!menuItem) {
    return (
      <View style={styles.container}>
        <Text>Item not found.</Text>
      </View>
    );
  }

  // Initialize options state based on menuItem.options
  const initialOptionsState = menuItem.options?.reduce(
    (optionsState: Record<OptionKeys, boolean>, option: string) => {
      optionsState[option] = false;
      return optionsState;
    },
    {}
  ) || {};
  
  const [options, setOptions] = useState<Record<OptionKeys, boolean>>(initialOptionsState);

  const toggleOption = (option: OptionKeys) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
  };

  // Check if menuItem.options exists and has options
  if (!menuItem.options || menuItem.options.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{menuItem.name}</Text>
        <Text style={styles.price}>${menuItem.price}</Text>
        <Text style={styles.description}>{menuItem.description}</Text>
        {/* No customization options available */}
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => {
            // Add to cart logic
          }}
        >
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{menuItem.name}</Text>
      <Text style={styles.price}>${menuItem.price}</Text>
      <Text style={styles.description}>{menuItem.description}</Text>

      {menuItem.options && menuItem.options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Customize your order:</Text>
          {menuItem.options.map((option: string) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                options[option] && styles.optionButtonSelected,
              ]}
              onPress={() => toggleOption(option)}
            >
              <Text style={styles.optionButtonText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => {
          // Add to cart logic
        }}
      >
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: "#00BFA6",
  },
  optionButtonText: {
    fontSize: 16,
    textAlign: "center",
  },
  addToCartButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  addToCartButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
