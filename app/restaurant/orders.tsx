import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";
import { format, isToday, parseISO } from "date-fns";

type GroupedOrder = {
  orderMeta: {
    orderId: string;
    totalItems: number;
    totalCost: number;
    paidAt: string | null;
    acceptedAt: string | null;
    readyAt: string | null;
    pickupOpen: string;
    pickupClose: string;
    comments: string;
  };
  items: OrderItem[];
};

type GroupedPickupWindow = {
  pickupOpen: string;
  pickupClose: string;
  orders: GroupedOrder[];
};

type OrderItem = {
  itemName: string;
  itemQuantity: number;
  itemPrice: number;
  totalItemCost: number;
};

function RestaurantOrders() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [displayOrders, setDisplayOrders] = useState<GroupedPickupWindow[]>([]);
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
            ),
            comments
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
              comments: entry.order?.comments,
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
      
      const groupedOrdersArray = Object.values(groupedOrders);

      // Group orders by pickupWindow time
      const ordersByPickupWindow: Record<string, any[]> = {};

      groupedOrdersArray.forEach(order => {
        const pickupTime = order.orderMeta.pickupOpen;
        if (!pickupTime) return; // skip if no pickup time

        if (!ordersByPickupWindow[pickupTime]) {
          ordersByPickupWindow[pickupTime] = [];
        }

        ordersByPickupWindow[pickupTime].push(order);
      });

      // Create a final array of pickup groups, sorted by time
      const groupedByPickupArray = Object.entries(ordersByPickupWindow)
        .sort((a, b) => {
          const timeA = parseISO(a[0]);
          const timeB = parseISO(b[0]);
          return timeA.getTime() - timeB.getTime();
        })
        .map(([pickupOpen, orders]) => ({
          pickupOpen,
          pickupClose: orders[0].orderMeta.pickupClose, // assume same close time for group
          orders,
        }));

      setDisplayOrders(groupedByPickupArray);

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

      <View style={{ padding: 16, flex: 1 }}>
        {displayOrders.length === 0 ? (
          <Text>No orders for today.</Text>
        ) : (
          <FlatList
            data={displayOrders}
            keyExtractor={(item, index) => `pickup-group-${item.pickupOpen}-${index}`}
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => {
              return (
                <View style={{ marginBottom: 24, backgroundColor: "#F0F9F7", borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
                    Pickup Window: {format(parseISO(item.pickupOpen), "h:mmaaa")} - {format(parseISO(item.pickupClose), "h:mmaaa")}
                  </Text>

                  <View style={{ flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#ccc", backgroundColor: "#DFF6F3", borderRadius: 6 }}>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Item</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Qty</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Price</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Total</Text>
                    <Text style={{ flex: 1, fontWeight: "bold" }}>Comments</Text>
                  </View>

                  {/* Orders */}
                  {item.orders.map((order, orderIndex: number) => (
                    <View key={orderIndex} style={{ marginBottom: 16, padding: 8, backgroundColor: "#fff", borderRadius: 8 }}>
                      <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                        Order ID: {order.orderMeta.orderId}
                      </Text>

                      {order.items.map((item: OrderItem, idx: number) => (
                        <View key={idx} style={{ flexDirection: "row", paddingVertical: 6 }}>
                          <Text style={{ flex: 1 }}>{item.itemName}</Text>
                          <Text style={{ flex: 1 }}>{item.itemQuantity}</Text>
                          <Text style={{ flex: 1 }}>${item.itemPrice?.toFixed(2)}</Text>
                          <Text style={{ flex: 1 }}>${item.totalItemCost?.toFixed(2)}</Text>

                          {/* Show comment once for the entire order */}
                          {idx === 0 ? (
                            <Text style={{ flex: 1 }}>
                              {order.orderMeta.comments ? order.orderMeta.comments.trim() : 'No comments'}
                            </Text>
                          ) : (
                            <Text style={{ flex: 1 }}></Text>
                          )}
                        </View>
                      ))}
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
