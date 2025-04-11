import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";

function RestaurantDashboard() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get the current logged in user
    const fetchRestaurantName = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      // Get the restaurant_id from restaurant_users table
      const { data: restaurantUser, error: restaurantUserError } = await supabase
        .from("restaurant_users")
        .select("restaurant_id")
        .eq("user_id", session.user.id)
        .single();

      if (restaurantUserError || !restaurantUser) {
        console.error("Error fetching restaurant ID:", restaurantUserError);
        setLoading(false);
        return;
      }
      
      // Fetch the restaurant name from restaurant table
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurant")
        .select("name")
        .eq("id", restaurantUser.restaurant_id)
        .single();

      if (restaurantError || !restaurant) {
        console.error("Error fetching restaurant name:", restaurantError);
        setLoading(false);
        return;
      }

      setRestaurantName(restaurant.name);
      setLoading(false);
    };

    fetchRestaurantName();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout Error", error.message);
    } else {
      router.replace("/login");
      Alert.alert("Successfully logged out!");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 32 }}>
        Welcome to {restaurantName}!
      </Text>

      <CustomButton
        title="View Today's Orders"
        onPress={() => router.push("/restaurant/orders")}
      />
      <CustomButton
        title="Logout"
        onPress={handleLogout}
      />
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantDashboard, ["restaurant"]);
