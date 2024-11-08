import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export default function MenuItemDetail() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme() ?? 'light';
  const styles = useThemedStyles();

  useEffect(() => {
    if (id) {
      fetchMenuItem();
    }
  }, [id]);

  const fetchMenuItem = async () => {
    try {
      const { data, error } = await supabase
        .from('item')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setItem(data);
    } catch (error) {
      console.error('Error fetching menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image_url }} style={styles.itemImage} />

      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <Text style={styles.description}>{item.description}</Text>

      <TouchableOpacity style={styles.addToCartButton}>
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}

function useThemedStyles() {
  const colorScheme = useColorScheme() ?? 'light';

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: Colors[colorScheme].background,
    },
    itemImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
    },
    price: {
      fontSize: 24,
      color: Colors[colorScheme].tint,
      marginVertical: 10,
    },
    description: {
      fontSize: 18,
      color: Colors[colorScheme].text,
      marginBottom: 20,
    },
    addToCartButton: {
      backgroundColor: Colors[colorScheme].tint,
      padding: 15,
      borderRadius: 5,
      alignItems: 'center',
    },
    addToCartButtonText: {
      color: Colors[colorScheme].background,
      fontSize: 18,
      fontWeight: 'bold',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme].background,
    },
    loadingText: {
      color: Colors[colorScheme].text,
      marginTop: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors[colorScheme].background,
      padding: 20,
    },
    errorText: {
      color: '#ff0000',
      textAlign: 'center',
    },
  });
}
