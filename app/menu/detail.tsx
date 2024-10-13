import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
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

      const { data: allergenData, error: allergenError } = await supabase
        .from('item_allergen')
        .select('*')
        .eq('item', id);

      if (allergenError) throw allergenError;

      console.log('Fetched menu item:', itemData);
      console.log('Fetched allergens:', allergenData);

      setMenuItem(itemData as MenuItemType);
      setAllergens(allergenData as AllergenType[]);
    } catch (error) {
      setError('Failed to fetch menu item');
      console.error('Error fetching menu item:', error);
    } finally {
      setLoading(false);
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
          <Text style={styles.allergensTitle}>Allergens:</Text>
          {allergens.map((allergen) => (
            <Text key={allergen.id} style={styles.allergenItem}>
              • {allergen.allergen}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.addToCartButton, !menuItem.available && styles.disabledButton]}
        onPress={() => {
          // Add to cart logic
        }}
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
  allergenItem: {
    fontSize: 16,
    marginBottom: 5,
  },
});