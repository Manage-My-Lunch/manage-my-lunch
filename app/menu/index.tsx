import { Text, View, StyleSheet, FlatList, TouchableOpacity, Button, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import React from "react";

// Define the MenuItemType at the top of the file
type MenuItemType = {
  category: string;
  id: string;
  name: string;
  price: number;
  description?: string;
  options?: string[]; // Add options field
};

export default function Menu() {
  const router = useRouter();
  
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([
    {
      id: '1',
      name: 'Sandwich',
      price: 5,
      category: 'Main',
      options: ['Add Cheese', 'Extra Meat', 'Gluten-Free Bread'],
    },
    {
      id: '2',
      name: 'Salad',
      price: 7,
      category: 'Side',
      options: ['Add Chicken', 'Extra Dressing', 'No Onions'],
    },
    {
      id: '3',
      name: 'Pizza',
      price: 8,
      category: 'Main',
      options: ['Extra Cheese', 'Thin Crust', 'Stuffed Crust'],
    },
    {
      id: '4',
      name: 'Soda',
      price: 2,
      category: 'Drink',
      options: ['No Ice', 'Extra Lemon'],
    },
    {
      id: '5',
      name: 'Ice Cream',
      price: 3,
      category: 'Dessert',
      options: ['Chocolate Sauce', 'Sprinkles', 'Whipped Cream'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>(menuItems);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    filterItems();
  }, [searchQuery, activeFilter]);

  const filterItems = () => {
    let filtered = menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeFilter === 'price') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (activeFilter === 'category') {
      filtered = filtered.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(filtered);
  };

  const renderItem = ({ item }: { item: MenuItemType }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        router.push({
          pathname: '/menu/detail',
          params: { item: JSON.stringify(item) },
        })
      }
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
      <Text style={styles.category}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>Sample Restaurant</Text>
        <Text style={styles.restaurantDescription}>Delicious food for everyone</Text>
        <Text style={styles.restaurantRating}>Rating: 4.5 / 5</Text>
      </View>

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
          onPress={() => setActiveFilter(activeFilter === 'price' ? '' : 'price')} 
          color={activeFilter === 'price' ? '#00BFA6' : undefined}
        />
        <Button 
          title="Category" 
          onPress={() => setActiveFilter(activeFilter === 'category' ? '' : 'category')} 
          color={activeFilter === 'category' ? '#00BFA6' : undefined}
        />
      </View>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.cartButton} onPress={() => {/* Navigate to cart */}}>
        <Text style={styles.cartButtonText}>Cart (0)</Text>
      </TouchableOpacity>
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
});