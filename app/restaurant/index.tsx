import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, FlatList } from "react-native";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "../../components/withRoleProtection";

function RestaurantDashboard() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [displayOrders, setDisplayOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select(`
          *,
          item (
            id,
            name,
            price,
            restaurant
          ),
          order (
            id,
            total_cost,
            total_items,
            paid_at,
            accepted_at,
            ready_at,
            pickup_window (
              id,
              open,
              close
            )
          )
        `);

      if (orderItemsError) {
        console.error("Error fetching order items:", orderItemsError);
        setLoading(false);
        return;
      }

      console.log("orderItemsData:", orderItemsData);

      const filteredOrderItems = orderItemsData.filter(
        (entry) => entry.item?.restaurant === restaurantId
      );

      console.log("Filtered Order Items:", filteredOrderItems);
      
      const displayOrders = filteredOrderItems.map((entry) => {
        const quantity = entry?.quantity ?? 1;
        const price = entry.item?.price ?? 0;
        return {
          itemName: entry.item?.name,
          itemPrice: price,
          itemQuantity: quantity,
          totalItemCost: price * quantity,
          orderId: entry.order?.id,
          totalItems: entry.order?.total_items,
          totalCost: entry.order?.total_cost,
          paidAt: entry.order?.paid_at,
          acceptedAt: entry.order?.accepted_at,
          readyAt: entry.order?.ready_at,
          pickupOpen: entry.order?.pickup_window?.open,
          pickupClose: entry.order?.pickup_window?.close,
        };
      });         
      
      setDisplayOrders(displayOrders);
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
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
        Welcome to {restaurantName}!
      </Text>
  
      {displayOrders.length === 0 ? (
        <Text>No orders found.</Text>
      ) : (
        <FlatList
          data={displayOrders}
          keyExtractor={(item, index) => `${item.orderId}-${index}`}
          ListHeaderComponent={() => (
            <View style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#ccc" }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Item</Text>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Qty</Text>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Price</Text>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Pickup</Text>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Total</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" }}>
              <Text style={{ flex: 1 }}>{item.itemName}</Text>
              <Text style={{ flex: 1 }}>{item.itemQuantity}</Text>
              <Text style={{ flex: 1 }}>${item.itemPrice?.toFixed(2)}</Text>
              <Text style={{ flex: 1 }}>{item.pickupOpen} - {item.pickupClose}</Text>
              <Text style={{ flex: 1 }}>${item.totalItemCost?.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );  
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantDashboard, ["restaurant"]);
