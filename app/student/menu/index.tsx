import { useEffect, useState } from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "@/components/withRoleProtection";
import { RestaurantType } from "@/lib/types";

export function Index() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'default' | 'popularity'>('default');

  useEffect(() => {
    fetchRestaurants();
  }, [sortType]);

  // Format popularity: 1000+ for >=1000, 100+ for >=100, 10+ for >=10
  const formatPopularity = (value: number): string => {
    if (value >= 1000) return '1000+';
    if (value >= 100) return `${Math.floor(value / 100) * 100}+`;
    if (value >= 10) return `${Math.floor(value / 10) * 10}+`;
    return value.toString();
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("restaurant").select("*");

      if (error) throw error;

      const sortedData = data.sort((a, b) => {
        // Sort by monthly sales or opening status
        if (sortType === 'popularity') {
          return (b.monthly_sale || 0) - (a.monthly_sale || 0);
        } else {
          if (a.is_busy === b.is_busy) {
            return 0;
          }
          return a.is_busy ? -1 : 1;
        }
      });

      setRestaurants(sortedData);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: RestaurantType }) => (
    <TouchableOpacity
      style={[styles.restaurantItem, !item.is_busy && styles.disabledItem]}
      onPress={() =>
        router.push({
          pathname: "/student/menu/restaurant",
          params: { restaurantId: item.id },
        })
      }
      disabled={!item.is_busy}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.restaurantImage}
        />
        {!item.is_busy && (
          <Image
            source={require("@/assets/images/busy.png")}
            style={styles.busyOverlay}
          />
        )}
      </View>
      <Text style={styles.restaurantName}>{item.name}</Text>
      <View style={styles.infoContainer}>
        <Text style={styles.restaurantDescription}>{item.description}</Text>
        <View style={styles.popularityContainer}>
          <Image 
            source={require("@/assets/images/star.png")} 
            style={[styles.starIcon, sortType === 'popularity' && { opacity: 1 }]} 
          />
          <Text style={[styles.popularityText, sortType === 'popularity' && { opacity: 1 }]}>
            {formatPopularity(item.monthly_sale || 0)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Sort Restaurants By:</Text>
        <View style={styles.sortingContainer}>
          <Pressable
            style={[styles.sortButton, sortType === 'default' && styles.activeSortButton]}
            onPress={() => setSortType('default')}
          >
            <Text style={[styles.sortButtonText, sortType === 'default' && styles.activeSortButtonText]}>
              Opening Status
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortButton, sortType === 'popularity' && styles.activeSortButton]}
            onPress={() => setSortType('popularity')}
          >
            <Image 
              source={require("@/assets/images/star.png")} 
              style={[styles.starIcon, sortType === 'popularity' && { opacity: 1 }]} 
            />
            <Text style={[styles.sortButtonText, sortType === 'popularity' && styles.activeSortButtonText]}>
              Most Popular
            </Text>
          </Pressable>
        </View>
      </View>
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
  imageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  busyOverlay: {
    position: "absolute",
    width: "70%",
    height: "70%",
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

  // Popularity display styles
  infoContainer: {
    width: "100%",
    alignItems: "center",
  },
  popularityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  starIcon: {
    width: 16,
    height: 16,
    tintColor: "#FFB800",
    opacity: 0.5,
    marginRight: 4,
  },
  popularityText: {
    fontSize: 12,
    color: "#FFB800",
    opacity: 0.5,
  },

  // Sorting section styles
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  sortingContainer: {
    flexDirection: "row",
    gap: 10,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    marginRight: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  activeSortButton: {
    backgroundColor: "#00BFA6",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  activeSortButtonText: {
    color: "#fff",
  },
});
// Protect the component with role-based access for students
export default withRoleProtection(Index, ["student"]);
