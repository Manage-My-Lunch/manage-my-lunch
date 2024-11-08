import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export type MenuItemType = {
  id: string;
  created_at: string;
  updated_at: string;
  restaurant: string | null;
  image_url: string;
  description: string;
  price: number;
  name: string;
  category: string;
};

export type RestaurantType = {
  id: string;
  name: string;
  description: string;
  is_open: boolean;
  image_url: string;
  is_busy: boolean;
};

export default function Menu() {
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams();

  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);

  const styles = useThemedStyles();
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantAndMenuItems();
    }
  }, [restaurantId]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, activeFilter]);

  const fetchRestaurantAndMenuItems = async () => {
    try {
      setLoading(true);

      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      setRestaurant(restaurantData);

      const { data: menuData, error: menuError } = await supabase
        .from('item')
        .select('*')
        .eq('restaurant', restaurantId);

      if (menuError) throw menuError;

      setMenuItems(menuData);
      setFilteredItems(menuData);
    } catch (error) {
      setError('Failed to fetch restaurant and menu items');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let items = [...menuItems];

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'price') {
      items.sort((a, b) => a.price - b.price);
    } else if (activeFilter === 'category') {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(items);
  };

  const renderItem = ({ item }: { item: MenuItemType }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        !restaurant?.is_open && styles.disabledItem,
      ]}
      onPress={() =>
        router.push({
          pathname: '/menu/detail',
          params: { id: item.id, restaurantId: item.restaurant },
        })
      }
      disabled={!restaurant?.is_open}
    >
      <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />
      <Text style={styles.menuItemName}>{item.name}</Text>
      <Text style={styles.menuItemDescription}>{item.description}</Text>
      <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      <Text style={styles.menuItemCategory}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {restaurant && (
        <View style={styles.restaurantInfo}>
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.restaurantImage}
          />
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>
            {restaurant.description}
          </Text>
        </View>
      )}

      <TextInput
        style={styles.searchBar}
        placeholder="Search menu items..."
        placeholderTextColor={Colors[colorScheme].icon}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterButtons}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setActiveFilter('price')}
        >
          <Text style={styles.filterButtonText}>Price</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setActiveFilter('category')}
        >
          <Text style={styles.filterButtonText}>Category</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setSearchQuery('');
            setActiveFilter('');
          }}
        >
          <Text style={styles.filterButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <View key={item.id}>{renderItem({ item })}</View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function useThemedStyles() {
  const colorScheme = useColorScheme() ?? 'light';

  return StyleSheet.create({
    container: {
      backgroundColor: Colors[colorScheme].background,
    },
    restaurantInfo: {
      alignItems: 'center',
      marginBottom: 10,
      padding: 10,
    },
    restaurantImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
    },
    restaurantName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
      marginTop: 10,
    },
    restaurantDescription: {
      fontSize: 16,
      color: Colors[colorScheme].text,
      textAlign: 'center',
      marginTop: 5,
    },
    searchBar: {
      height: 40,
      borderColor: Colors[colorScheme].icon,
      borderWidth: 1,
      borderRadius: 5,
      paddingLeft: 10,
      marginHorizontal: 10,
      marginBottom: 10,
      color: Colors[colorScheme].text,
      backgroundColor: Colors[colorScheme].background,
    },
    filterButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginHorizontal: 10,
    },
    filterButton: {
      flex: 1,
      padding: 10,
      borderRadius: 5,
      backgroundColor: Colors[colorScheme].tint,
      marginHorizontal: 5,
      alignItems: 'center',
    },
    filterButtonText: {
      color: Colors[colorScheme].background,
      fontWeight: 'bold',
    },
    itemsContainer: {
      paddingHorizontal: 10,
    },
    menuItem: {
      backgroundColor: Colors[colorScheme].background,
      padding: 15,
      marginVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors[colorScheme].icon,
    },
    menuItemImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
    },
    menuItemName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: Colors[colorScheme].text,
      marginTop: 10,
    },
    menuItemDescription: {
      fontSize: 14,
      color: Colors[colorScheme].text,
      textAlign: 'center',
      marginTop: 5,
    },
    menuItemPrice: {
      fontSize: 16,
      color: Colors[colorScheme].tint,
      fontWeight: 'bold',
      marginTop: 5,
    },
    menuItemCategory: {
      fontSize: 14,
      color: Colors[colorScheme].icon,
      marginTop: 5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      color: Colors[colorScheme].text,
      marginTop: 10,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: '#ff0000',
      textAlign: 'center',
    },
    disabledItem: {
      opacity: 0.5,
    },
  });
}
