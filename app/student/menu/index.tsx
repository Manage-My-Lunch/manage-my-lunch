import { useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "@/components/withRoleProtection";
import { RestaurantType } from "@/lib/types";
import CuisineList from "@/components/student/menu/CuisineList";

type MenuRestaurant = RestaurantType & {
  restaurant_category: { category: { id: string; name: string } }[];
};

export function Index() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<MenuRestaurant[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleFilter = (id: string | null) => {
    if (categoryFilter === id) {
      setCategoryFilter(null);
    } else {
      setCategoryFilter(id);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurant")
        .select("*, restaurant_category(category(*))");

      if (error) throw error;

      // Sort restaurants: is_busy === true last
      const sortedData = data.sort((a, b) => {
        if (a.is_busy === b.is_busy) {
          return 0; // No change in order if both have the same is_busy value
        }
        return !a.is_busy ? -1 : 1; // is_busy === true comes last
      });

      setRestaurants(sortedData);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: MenuRestaurant }) => {
    if (
      categoryFilter === null ||
      item.restaurant_category.findIndex((c) => {
        return c.category.id === categoryFilter;
      }) > -1
    ) {
      return (
        <TouchableOpacity
          style={[styles.restaurantItem, item.is_busy && styles.disabledItem]}
          onPress={() =>
            router.push({
              pathname: "/student/menu/restaurant",
              params: { restaurantId: item.id },
            })
          }
          disabled={item.is_busy}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.restaurantImage}
            />
            {item.is_busy && (
              <Image
                source={require("@/assets/images/busy.png")}
                style={styles.busyOverlay}
              />
            )}
          </View>
          <Text style={styles.restaurantName}>{item.name}</Text>
          <Text style={styles.restaurantDescription}>{item.description}</Text>
        </TouchableOpacity>
      );
    }

    return <></>;
  };

  return (
    <View style={styles.container}>
      <CuisineList
        filter={categoryFilter}
        handleFilter={handleFilter}
      ></CuisineList>
      {loading ? (
        <ActivityIndicator size="large" color="#00BFA6" />
      ) : (
        <FlatList
          data={restaurants}
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
  },
  list: {
    padding: 10,
  },
  restaurantItem: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledItem: {
    opacity: 0.5,
  },
  restaurantImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
  },
  restaurantDescription: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginTop: 5,
  },
  statusText: {
    marginTop: 5,
    color: "#ff0000",
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  busyOverlay: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderRadius: 8,
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(Index, ["student"]);
