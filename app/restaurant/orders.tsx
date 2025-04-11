import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";
import { format, isToday, parseISO } from "date-fns";

type OrderItem = {
  itemName: string;
  itemQuantity: number;
  itemPrice: number;
  totalItemCost: number;
};

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
  
      // Fetch restaurant name using restaurantId
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

      const groupedOrders: Record<string, any> = {};
  
      const filteredOrderItems = orderItemsData.filter(
        (entry) => {
          const isFromThisRestaurant = entry.item?.restaurant === restaurantId;
          const pickupOpen = entry.order?.pickup_window?.open;
          const isPickupToday = pickupOpen && isToday(parseISO(pickupOpen));
          return isFromThisRestaurant && isPickupToday;
        }
      );

      filteredOrderItems.forEach((entry) => {
        const orderId = entry.order?.id;
        if (!orderId) return;
      
        if (!groupedOrders[orderId]) {
          groupedOrders[orderId] = {
            orderMeta: {
              orderId,
              totalItems: entry.order?.total_items,
              totalCost: entry.order?.total_cost,
              paidAt: entry.order?.paid_at,
              acceptedAt: entry.order?.accepted_at,
              readyAt: entry.order?.ready_at,
              pickupOpen: entry.order?.pickup_window?.open,
              pickupClose: entry.order?.pickup_window?.close,
            },
            items: [],
          };
        }
      
        groupedOrders[orderId].items.push({
          itemName: entry.item?.name,
          itemPrice: entry.item?.price,
          itemQuantity: entry?.quantity ?? 1,
          totalItemCost: (entry.item?.price ?? 0) * (entry?.quantity ?? 1),
        });
      });
      
      const sortedGroupedOrders = Object.values(groupedOrders).sort((a, b) => {
        const timeA = parseISO(a.orderMeta.pickupOpen);
        const timeB = parseISO(b.orderMeta.pickupOpen);
        return timeA.getTime() - timeB.getTime();
      });
      
      setDisplayOrders(sortedGroupedOrders);
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
                marginTop: 0,
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
          <Text>No orders for today.</Text>
        ) : (
          <FlatList
            data={displayOrders}
            keyExtractor={(item, index) => `group-${item.orderMeta.orderId}-${index}`}
            renderItem={({ item, index }) => {
              const isEven = index % 2 === 0;
              const bgColor = isEven ? "#F9F9F9" : "#E6F7F5";

              return (
                <View style={{ marginBottom: 16, backgroundColor: bgColor, borderRadius: 8, padding: 8 }}>
                  <View style={{ flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#ccc" }}>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Item</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Quantity</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Price</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Total</Text>
                  </View>
                  <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                    Order ID: {item.orderMeta.orderId} | Pickup:{" "}
                    {format(parseISO(item.orderMeta.pickupOpen), "h:mmaaa")} -{" "}
                    {format(parseISO(item.orderMeta.pickupClose), "h:mmaaa")}
                  </Text>
                  {item.items.map((orderItem: OrderItem, idx: number)  => (
                    <View key={idx} style={{ flexDirection: "row", paddingVertical: 6 }}>
                      <Text style={{ flex: 1 }}>{orderItem.itemName}</Text>
                      <Text style={{ flex: 1 }}>{orderItem.itemQuantity}</Text>
                      <Text style={{ flex: 1 }}>${orderItem.itemPrice?.toFixed(2)}</Text>
                      <Text style={{ flex: 1 }}>${orderItem.totalItemCost?.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantOrders, ["restaurant"]);
