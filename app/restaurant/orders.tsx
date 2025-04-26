import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";
import { format, isToday, parseISO } from "date-fns";
import alert from "@/components/alert";

// --- Types ---
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
  
      // Filter by restaurant and today's pickup window
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

  // Update order status as ready
  const markOrderAsReady = async (orderId: string) => {
    const { error } = await supabase
      .from("order")
      .update({ ready_at: new Date().toISOString() })
      .eq("id", orderId);
  
    if (error) {
      console.error("Failed to update ready_at:", error.message);
      return false;
    }
  
    return true;
  };  

  // --- Loading State ---
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{restaurantName}</Text>
        <CustomButton
          title="Return to Dashboard"
          onPress={() => router.push("/restaurant")}
          style={styles.backButton}
          textStyle={styles.backButtonText}
        />
      </View>

      {/* Orders */}
      <View style={styles.ordersContainer}>
        {displayOrders.length === 0 ? (
          <Text>No orders for today.</Text>
        ) : (
          <FlatList
            data={displayOrders}
            keyExtractor={(item, index) => `pickup-group-${item.pickupOpen}-${index}`}
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <View style={styles.pickupGroup}>
                <Text style={styles.pickupTitle}>
                  Pickup Window: {format(parseISO(item.pickupOpen), "h:mmaaa")} - {format(parseISO(item.pickupClose), "h:mmaaa")}
                </Text>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Item</Text>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                  <Text style={styles.tableHeaderText}>Price</Text>
                  <Text style={styles.tableHeaderText}>Total</Text>
                  <Text style={styles.tableHeaderText}>Comments</Text>
                  <Text style={styles.tableHeaderText}>Status</Text>
                </View>

                {/* Orders in group */}
                {item.orders.map((order, orderIndex) => (
                  <View key={orderIndex} style={styles.orderCard}>
                    <Text style={styles.orderId}>Order ID: {order.orderMeta.orderId}</Text>
                    {order.items.map((item, idx) => (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.itemName}</Text>
                        <Text style={styles.tableCell}>{item.itemQuantity}</Text>
                        <Text style={styles.tableCell}>${item.itemPrice?.toFixed(2)}</Text>
                        <Text style={styles.tableCell}>${item.totalItemCost?.toFixed(2)}</Text>

                        {idx === 0 ? (
                          <Text style={styles.tableCell}>
                            {order.orderMeta.comments?.trim() || "No comments"}
                          </Text>
                        ) : (
                          <Text style={styles.tableCell}></Text>
                        )}

                        {idx === 0 ? (
                        <View style={styles.tableCell}>
                          <CustomButton
                            title={order.orderMeta.readyAt === null ? "Mark as Ready" : "Ready"}
                            onPress={async () => {
                              if (order.orderMeta.readyAt === null) {
                                alert(
                                  "Confirm Mark as Ready", // Title of the alert
                                  "Are you sure you want to mark this order as ready?", // Description
                                  [
                                    {
                                      text: "Yes",
                                      onPress: async () => {
                                        const success = await markOrderAsReady(order.orderMeta.orderId);
                                        if (success) {
                                          setDisplayOrders((prevOrders) =>
                                            prevOrders.map((pickupGroup) => ({
                                              ...pickupGroup,
                                              orders: pickupGroup.orders.map((o) =>
                                                o.orderMeta.orderId === order.orderMeta.orderId
                                                  ? {
                                                      ...o,
                                                      orderMeta: {
                                                        ...o.orderMeta,
                                                        readyAt: new Date().toISOString(),
                                                      },
                                                    }
                                                  : o
                                              ),
                                            }))
                                          );
                                        }
                                      },
                                    },
                                    {
                                      text: "No",
                                      style: "cancel",
                                      onPress: () => {},
                                    },
                                  ]
                                );
                              }
                            }}
                            style={{
                              marginTop: 0,
                              marginBottom: 20,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              borderRadius: 8,
                              backgroundColor: order.orderMeta.readyAt === null ? "#00BFA6" : "#E0E0E0", // Green when not ready, grey when ready
                            }}
                            textStyle={{
                              color: order.orderMeta.readyAt === null ? "#fff" : "#B0B0B0", // White text when not ready, grey text when ready
                            }}
                            disabled={order.orderMeta.readyAt !== null} // Disable the button when ready
                          />
                        </View>
                      ) : (
                        <Text style={styles.tableCell}></Text>
                      )}
                      </View>
                    ))}
                  </View>
                ))}
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

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#00BFA6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  backButtonText: {
    color: "#00BFA6",
  },
  ordersContainer: {
    padding: 16,
    flex: 1,
  },
  pickupGroup: {
    marginBottom: 24,
    backgroundColor: "#F0F9F7",
    borderRadius: 12,
    padding: 12,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#DFF6F3",
    borderRadius: 6,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: "bold",
  },
  orderCard: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  orderId: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  tableCell: {
    flex: 1,
  },
});

