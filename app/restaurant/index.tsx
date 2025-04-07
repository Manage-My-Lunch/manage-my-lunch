import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "../../components/withRoleProtection";

// Define the types for the order data
interface OrderItem {
  order: string; // Order ID
  item: {
    id: string;
    restaurant: string;
  } | null;
}

interface PickupWindow {
  id: string;
  open: string;
  close: string;
}

interface Order {
  id: string;
  pickup_window: PickupWindow;
  total_cost: number;
  total_items: number;
  paid_at: string | null;
  accepted_at: string | null;
  ready_at: string | null;
}

function RestaurantDashboard() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurantNameAndOrders = async () => {
      setLoading(true);

      // Get the current logged in user
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error("Error getting session:", sessionError);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      console.log("User ID:", userId);

      // Get the restaurant_id from restaurant_users table
      const { data: restaurantUserData, error: restaurantUserError } = await supabase
        .from("restaurant_users")
        .select("restaurant_id")
        .eq("user_id", userId)
        .single();

      if (restaurantUserError || !restaurantUserData) {
        console.error("Error fetching restaurant ID:", restaurantUserError);
        setLoading(false);
        return;
      }

      const restaurantId = restaurantUserData.restaurant_id;
      console.log("Restaurant ID:", restaurantId);

      // Fetch the restaurant name from restaurant table
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurant")
        .select("name")
        .eq("id", restaurantId)
        .single();

      if (restaurantError || !restaurantData) {
        console.error("Error fetching restaurant name:", restaurantError);
        setLoading(false);
        return;
      }

      setRestaurantName(restaurantData.name);

      // Fetch order items linked to the restaurant
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_item")
        .select("order, item: item (id, restaurant)")

      if (orderItemsError) {
        console.error("Error fetching order items:", orderItemsError);
        setLoading(false);
        return;
      }

      console.log("orderItemsData:", orderItemsData);


      setLoading(false);
    };

    fetchRestaurantNameAndOrders();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to {restaurantName}!</Text>
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantDashboard, ["restaurant"]);
