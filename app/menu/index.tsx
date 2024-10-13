import { Text, View, StyleSheet, FlatList, TouchableOpacity, Button, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import React from "react";
import { supabase } from '@/lib/supabase';

// Define the MenuItemType at the top of the file
export type MenuItemType = {
  id: string;
  created_at: string;
  updated_at: string;
  restaurant: string | null;
  image_url: string;
  description: string;
  price: number;
  available: boolean;
  name: string;
  category: string;
};

export type AllergenType = {
  name: any;
  id: string;
  created_at: string;
  allergen: string;
  item: string;
};

export type RestaurantType = {
  id: string;
  name: string;
  description: string;
  is_open: boolean;
};

export default function Menu() {
  const router = useRouter();
  
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);

  useEffect(() => {
    fetchRestaurantAndMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, activeFilter]);

  const fetchRestaurantAndMenuItems = async () => {
    try {
      setLoading(true);
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurant')
        .select('*')
        .single();

      if (restaurantError) throw restaurantError;

      setRestaurant(restaurantData);

      const { data: menuData, error: menuError } = await supabase
        .from('item')
        .select('*');

      if (menuError) throw menuError;

      console.log('Menu items fetched:', menuData);

      setMenuItems(menuData);
      setFilteredItems(menuData);
    } catch (error) {
      setError('Failed to fetch restaurant and menu items');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter items locally without making additional API calls
  const filterItems = () => {
    let items = [...menuItems];

    if (searchQuery) {
      items = items.filter(item =>
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
      style={styles.item}
      onPress={() =>
        router.push({
          pathname: '/menu/detail',
          params: { id: item.id },
        })
      }
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <Text style={styles.category}>{item.category}</Text>
      {!item.available && <Text style={styles.unavailable}>Unavailable</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {restaurant && (
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
          <Text>
            Status: {restaurant.is_open ? 'Open' : 'Closed'}
          </Text>
        </View>
      )}

      <View style={styles.promotions}>
        <Text style={styles.promotionText}>20% off on all main dishes!</Text>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search menu items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterButtons}>
        <Button 
          title="Price" 
          onPress={() => setActiveFilter('price')} 
          color={activeFilter === 'price' ? '#00BFA6' : undefined}
        />
        <Button 
          title="Category" 
          onPress={() => setActiveFilter('category')} 
          color={activeFilter === 'category' ? '#00BFA6' : undefined}
        />
        <Button
          title="Clear Filters"
          onPress={() => {
            setSearchQuery('');
            setActiveFilter('');
          }}
        />
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <Text>Loading menu items...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {!loading && !error && (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  restaurantInfo: {
    marginBottom: 10,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  restaurantDescription: {
    fontSize: 16,
  },
  restaurantRating: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  promotions: {
    backgroundColor: '#FFD700',
    padding: 10,
    marginBottom: 10,
  },
  promotionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
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
  category: {
    fontSize: 14,
    color: "#777",
  },
  cartButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  cartButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rewards: {
    marginTop: 10,
  },
  rewardsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reviewsButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  reviewsButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  recommendations: {
    marginTop: 10,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  unavailable: {
    color: 'red',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});
