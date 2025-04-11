import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";

function RestaurantOrders() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [displayOrders, setDisplayOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
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
  
      // 🟢 Fetch restaurant name using restaurantId
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurant")
        .select("name")
        .eq("id", restaurantId)
        .single();
  
      if (restaurantError || !restaurantData) {
        console.error("Error fetching restaurant name:", restaurantError);
      } else {
        setRestaurantName(restaurantData.name);
      }
  
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
  
      const filteredOrderItems = orderItemsData.filter(
        (entry) => entry.item?.restaurant === restaurantId
      ) || [];
  
      const orders = filteredOrderItems.map((entry) => {
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
  
      setDisplayOrders(orders);
      setLoading(false);
    };
  
    fetchOrders();
  }, []);  

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{
        padding: 20,
        backgroundColor: "#00BFA6",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>
          {restaurantName}
        </Text>
        <CustomButton
            title="Return to Dashboard"
            onPress={() => router.push("/restaurant")}
            style={{
                marginTop: 0,        // remove the default top margin
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: "#fff"
              }}
              textStyle={{
                color: "#00BFA6"
              }}
        />
      </View>

      <View style={{ padding: 16 }}>
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
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantOrders, ["restaurant"]);
