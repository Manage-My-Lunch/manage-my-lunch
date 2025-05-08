import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView, StyleSheet } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import alert from "@/components/alert";
import { MenuItemType } from "@/lib/types";

type Order = {
  id: string;
  created_at: string;
  updated_at: string;
  user: string | null;
  paid_at: string | null;
  accepted_at: string | null;
  ready_at: string | null;
  driver_collected_at: string | null;
  delivered_at: string | null;
  collected_at: string | null;
  completed_at: string | null;
  total_cost: number;
  total_items: number;
  pickup_window: { open: string; close: string };
  comments: string;
  points_redeemed: number;
  points_earned: number;
};

type OrderItem = MenuItemType & { quantity: number; restaurant: string; image_url: string; line_total: number };

function OrderHistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("Error fetching user", userError?.message || "User not found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("order")
      .select(`*, pickup_window (open, close)`)
      .eq("user", user.id)
      .not('paid_at', 'is', null)  
      .limit(100);

    if (error) {
      console.error("Fetch error", error);
    } else {
      const sorted = (data || []).sort((a, b) => {
        const aTime = new Date(a.pickup_window?.open || a.created_at).getTime();
        const bTime = new Date(b.pickup_window?.open || b.created_at).getTime();
        return bTime - aTime;
      });
      setOrders(sorted as Order[]);
    }
    setLoading(false);
  };

  const fetchOrderItems = useCallback(async (orderId: string) => {
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_item")
      .select(`
        quantity,
        line_total,
        item (
          id,
          name,
          price,
          image_url,
          category,
          description,
          restaurant ( id, name ),
          created_at,
          updated_at
        )
      `)
      .eq('"order"', orderId);

    if (itemsError) {
      console.error("Failed to fetch order items", itemsError);
      return;
    }

    const items: OrderItem[] = itemsData.map((row: any) => ({
      ...row.item,
      quantity: row.quantity,
      line_total: row.line_total,
      restaurant: row.item.restaurant.name,
    }));

    setOrderItems(items);
    setIsModalVisible(true);
  }, []);

  const onSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  const groupedItems = useMemo(() => {
    return orderItems.reduce((grouped, item) => {
      const { restaurant } = item;
      if (!grouped[restaurant]) {
        grouped[restaurant] = [];
      }
      grouped[restaurant].push(item);
      return grouped;
    }, {} as Record<string, OrderItem[]>);
  }, [orderItems]);

  const renderOrderItem = ({ item }: { item: Order }) => {
    const date = new Date(item.pickup_window?.open).toLocaleDateString();
    let status = "Pending";
    if (item.completed_at) status = "Completed";
    else if (item.delivered_at || item.collected_at) status = "Delivered";
    else if (item.accepted_at) status = "Accepted";

    return (
      <TouchableOpacity
        onPress={() => onSelectOrder(item)}
        style={styles.orderItemContainer}
      >
        <Text style={styles.orderItemTitle}>Order #{item.id}</Text>
        <Text>Date: {date}</Text>
        <Text>Total: ${item.total_cost.toFixed(2)}</Text>
        <Text>Status: {status}</Text>
      </TouchableOpacity>
    );
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
        animationType="slide"
      >
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <Text>Order ID: {selectedOrder.id}</Text>
          <Text>
            Date: {new Date(selectedOrder.pickup_window?.open).toLocaleDateString('en-NZ')}
          </Text>
          <Text>
            Pickup Window: {new Date(selectedOrder.pickup_window?.open).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedOrder.pickup_window?.close).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text>Total: ${selectedOrder.total_cost.toFixed(2)}</Text>
          <Text>Comments: {selectedOrder.comments || "None"}</Text>

          <Text style={styles.modalSectionTitle}>Items:</Text>
          {Object.entries(groupedItems).map(([restaurant, items]) => (
            <View key={restaurant} style={styles.restaurantContainer}>
              <Text style={styles.restaurantTitle}>{restaurant}</Text>
              {items.map((item, index) => (
                <View key={index} style={styles.orderItemRow}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text>Quantity: {item.quantity}</Text>
                    <Text>Price: ${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity
            onPress={() => setIsModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.scrollContainer}
      ListFooterComponent={renderOrderDetails()}
    />
  );
}

const styles = StyleSheet.create({
  orderItemContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginVertical: 4,
    borderRadius: 8,
    width: "90%",
    alignSelf: "center",
  },
  orderItemTitle: {
    fontWeight: "bold",
  },
  modalContent: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSectionTitle: {
    marginTop: 12,
    fontWeight: "bold",
  },
  restaurantContainer: {
    marginVertical: 12,
  },
  restaurantTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  orderItemRow: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "center",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    paddingVertical: 16,
  },
});

export default withRoleProtection(OrderHistoryScreen, ["student"]);
