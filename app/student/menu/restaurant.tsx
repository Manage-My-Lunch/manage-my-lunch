import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Button,
  TextInput,
  Image,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import React from "react";
import { supabase } from "@/lib/supabase";
import { MenuItemType, RestaurantType } from "@/lib/types";
import RestaurantReviews from "@/components/student/review/RestaurantReviews";

export default function Menu() {
  const router = useRouter();
  const { restaurantId } = useLocalSearchParams();

  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<MenuItemType[]>([]);
  const [activeFilter, setActiveFilter] = useState("");
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);

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
        .from("restaurant")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      setRestaurant(restaurantData);

      const { data: menuData, error: menuError } = await supabase
        .from("item")
        .select("*")
        .eq("restaurant", restaurantId);

      if (menuError) throw menuError;

      setMenuItems(menuData);
      setFilteredItems(menuData);
    } catch (error) {
      setError("Failed to fetch restaurant and menu items");
      console.error("Error fetching data:", error);
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

    if (activeFilter === "price") {
      items.sort((a, b) => a.price - b.price);
    } else if (activeFilter === "category") {
      items.sort((a, b) => a.category.localeCompare(b.category));
    }

    setFilteredItems(items);
  };

  const renderItem = ({ item }: { item: MenuItemType }) => (
    <TouchableOpacity
      style={styles.restaurantItem}
      onPress={() =>
        router.push({
          pathname: "./detail",
          params: { id: item.id, restaurantId: item.restaurant },
        })
      }
    >
      <Image source={{ uri: item.image_url }} style={styles.restaurantImage} />
      <Text style={styles.restaurantName}>{item.name}</Text>
      <Text style={styles.restaurantDescription}>{item.description}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <Text style={styles.category}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {restaurant && (
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantDescription}>
            {restaurant.description}
          </Text>
        </View>
      )}

      <TextInput
        style={styles.searchBar}
        placeholder="Search menu items..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterButtons}>
        <Button
          title="Price"
          onPress={() => setActiveFilter("price")}
          color={activeFilter === "price" ? "#00BFA6" : undefined}
        />
        <Button
          title="Category"
          onPress={() => setActiveFilter("category")}
          color={activeFilter === "category" ? "#00BFA6" : undefined}
        />
        <Button
          title="Clear Filters"
          onPress={() => {
            setSearchQuery("");
            setActiveFilter("");
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
        <View>
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
          
          {restaurant && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <RestaurantReviews restaurantId={restaurant.id} />
            </View>
          )}
        </View>
      )}
    </ScrollView>
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
    fontWeight: "bold",
  },
  restaurantDescription: {
    fontSize: 16,
  },
  restaurantRating: {
    fontSize: 16,
    fontWeight: "bold",
  },
  searchBar: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingLeft: 10,
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
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
    color: "#00BFA6",
    fontWeight: "bold",
    marginTop: 5,
  },
  category: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  cartButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  cartButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  rewards: {
    marginTop: 10,
  },
  rewardsText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  reviewsButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  reviewsButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  recommendations: {
    marginTop: 10,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  restaurantItem: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledItem: {
    opacity: 0.5, // Makes the item appear grayed out
  },
  restaurantImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  statusText: {
    marginTop: 5,
    color: "#ff0000",
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backButtonText: {
    marginLeft: 5,
    color: "#00BFA6",
    fontSize: 16,
  },
  reviewsSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
