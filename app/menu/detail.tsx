import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import { MenuItemType, AllergenType } from "./index";

export default function MenuItemDetail() {
  const { id, restaurantId } = useLocalSearchParams();
  const [menuItem, setMenuItem] = useState<MenuItemType | null>(null);
  const [allergens, setAllergens] = useState<AllergenType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state variable to track user's selected allergens
  const [userAllergies, setUserAllergies] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMenuItem();
  }, [id]);

  const fetchMenuItem = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data: itemData, error: itemError } = await supabase
        .from('item')
        .select('*')
        .eq('id', id)
        .single();
      
      if (itemError) throw itemError;

      // Modified to join with the 'allergen' table to get allergen names
      const { data: allergenData, error: allergenError } = await supabase
        .from('item_allergen')
        .select('id, allergen (id, name)')
        .eq('item', id);

      if (allergenError) throw allergenError;

      console.log('Fetched menu item:', itemData);
      console.log('Fetched allergens:', allergenData);

      setMenuItem(itemData as MenuItemType);
      // Map the data to a list of allergens
      const allergensList = allergenData.map((item: any) => ({
        id: item.allergen.id,
        name: item.allergen.name,
        created_at: item.allergen.created_at,
        allergen: item.allergen.id,
        item: id,
      }));
      setAllergens(allergensList as AllergenType[]);
    } catch (error) {
      setError('Failed to fetch menu item');
      console.error('Error fetching menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle allergen button press
  const handleAllergenPress = (allergenName: string) => {
    setUserAllergies((prevAllergies) => {
      const newAllergies = new Set(prevAllergies);
      if (newAllergies.has(allergenName)) {
        newAllergies.delete(allergenName);
      } else {
        newAllergies.add(allergenName);
      }
      return newAllergies;
    });
  };

  // Function to handle 'Add to Cart' button press
  const handleAddToCart = () => {
    const itemAllergenNames = allergens.map((a) => a.name);
    const conflictingAllergens = itemAllergenNames.filter((a) => userAllergies.has(a));

    if (conflictingAllergens.length > 0) {
      Alert.alert(
        'Allergy Warning',
        `This item contains allergens you've marked: ${conflictingAllergens.join(', ')}. Do you still want to add it to your cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Anyway', onPress: () => { /* Add to cart logic */ } },
        ]
      );
    } else {
      // Add to cart logic
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (error || !menuItem) {
    return (
      <View style={styles.container}>
        <Text>{error || 'Item not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{menuItem.name}</Text>
      <Text style={styles.price}>${menuItem.price.toFixed(2)}</Text>
      <Text style={styles.description}>{menuItem.description}</Text>
      {!menuItem.available && <Text style={styles.unavailable}>Currently Unavailable</Text>}

      {allergens.length > 0 && (
        <View style={styles.allergensContainer}>
          <Text style={styles.allergensTitle}>Select Allergens You're Allergic To:</Text>
          {allergens.map((allergen) => (
            <TouchableOpacity
              key={allergen.id}
              style={[
                styles.allergenButton,
                userAllergies.has(allergen.name) && styles.allergicButton,
              ]}
              onPress={() => handleAllergenPress(allergen.name)}
            >
              <Text style={styles.allergenButtonText}>{allergen.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addToCartButton, !menuItem.available && styles.disabledButton]}
        onPress={handleAddToCart}
        disabled={!menuItem.available}
      >
        <Text style={styles.addToCartButtonText}>
          {menuItem.available ? 'Add to Cart' : 'Unavailable'}
        </Text>
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
  unavailable: {
    color: 'red',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  allergensContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  allergensTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  allergenButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#eeeeee',
    marginVertical: 5,
  },
  allergicButton: {
    backgroundColor: '#FFA07A',
  },
  allergenButtonText: {
    fontSize: 16,
  },
});