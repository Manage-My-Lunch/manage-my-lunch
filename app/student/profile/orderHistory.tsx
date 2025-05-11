import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView, StyleSheet } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import alert from "@/components/alert";
import { MenuItemType } from "@/lib/types";
import CustomButton from "@/components/customButton";

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
  cancelled_at: string | null;
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
  const [allOrders, setAllOrders] = useState<Order[] | null>(null);
  const [sortOption, setSortOption] = useState("newest");
  const [filterOption, setFilterOption] = useState("all");

  useEffect(() => {
    const fetchAndFilterOrders = async () => {
      try {
        const fetchedOrders = await fetchOrders();
        if (fetchedOrders) {
          setAllOrders(fetchedOrders);  // Save all fetched orders
          const updatedOrders = filterOrders(sortOrders(fetchedOrders));
          setOrders(updatedOrders);  // Show ALL filtered & sorted orders (no slicing!)
        }
      } catch (error) {
        console.error('Error fetching and filtering orders:', error);
      }
    };
  
    fetchAndFilterOrders();
  }, [sortOption, filterOption]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      alert("Error fetching user", userError?.message || "User not found.");
      setLoading(false);
      return []; // Return an empty array instead of void.
    }
  
    const { data, error } = await supabase
      .from("order")
      .select(`*, pickup_window (open, close)`)
      .eq("user", user.id)
      .not('paid_at', 'is', null)  
  
    setLoading(false);
  
    if (error) {
      console.error("Fetch error", error);
      return []; // Return an empty array on error.
    }
  
    return data; // Return fetched data here.
  };

  const sortOrders = (orders: Order[]) => {
    if (sortOption === "newest") {
      return orders.sort((a, b) => new Date(b.pickup_window.open).getTime() - new Date(a.pickup_window.open).getTime());
    } else if (sortOption === "oldest") {
      return orders.sort((a, b) => new Date(a.pickup_window.open).getTime() - new Date(b.pickup_window.open).getTime());
    }
    return orders;
  };

  const filterOrders = (orders: Order[]) => {
    if (filterOption === "all") return orders;
    return orders.filter((order) => {
      if (filterOption === "cancelled") return order.cancelled_at != null;
      if (filterOption === "completed") return order.completed_at != null || order.collected_at != null;
      return true;
    });
  };

  // Update sort and filter options
  const handleSortChange = (option: string) => {
    setSortOption(option); 
    const updatedOrders = filterOrders(sortOrders(allOrders || []));  // Apply sorting and filtering immediately
    setOrders(updatedOrders); // Update orders to reflect the changes
  };

  const handleFilterChange = (option: string) => {
    setFilterOption(option);
    const updatedOrders = filterOrders(sortOrders(allOrders || []));  // Apply filtering and sorting immediately
    setOrders(updatedOrders); // Update orders to reflect the changes
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
    if (item.cancelled_at) status = "Cancelled";
    else if (item.completed_at || item.collected_at) status = "Completed";
    else if (item.ready_at) status = "Ready for Delivery";
    else if (item.delivered_at) status = "Ready for Pickup";
    else if (item.accepted_at) status = "Accepted";

    return (
      <TouchableOpacity
        onPress={() => onSelectOrder(item)}
        style={styles.orderItemContainer}
      >
        <Text style={styles.orderItemTitle}>Date: {date}</Text>
        <View style={styles.orderDetails}>
          <Text style={styles.orderInfo}>{item.total_items} {item.total_items > 1 ? 'items' : 'item'} </Text>
          <Text style={styles.orderInfo}>Total: ${item.total_cost.toFixed(2)}</Text>
          <Text style={styles.orderInfo}>Status: {status}</Text>
        </View>
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
          <Text style={styles.modalInfo}>Order ID: {selectedOrder.id}</Text>
          <Text style={styles.modalInfo}>
            Date: {new Date(selectedOrder.pickup_window?.open).toLocaleDateString('en-NZ')}
          </Text>
          <Text style={styles.modalInfo}>
            Pickup Window: {new Date(selectedOrder.pickup_window?.open).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedOrder.pickup_window?.close).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.modalInfo}>Total: ${selectedOrder.total_cost.toFixed(2)}</Text>
          <Text style={styles.modalInfo}>Comments: {selectedOrder.comments || "None"}</Text>

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

          <CustomButton
            title="Close"
            onPress={() => setIsModalVisible(false)}
          />
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
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          {allOrders?.length === 0 ? (
            // If there are no orders at all
            <Text style={styles.noOrdersMessage}>You have no orders yet.</Text>
          ) : (
            <>
              <View style={styles.filterContainer}>
                <View style={styles.optionsRow}>
                <Text style={styles.sectionTitle}>Sort by:</Text>
                  <TouchableOpacity
                    style={[styles.optionButton, sortOption === "newest" && styles.optionButtonActive]}
                    onPress={() => handleSortChange("newest")}
                  >
                    <Text style={[styles.optionText, sortOption === "newest" && styles.optionTextActive]}>Newest</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, sortOption === "oldest" && styles.optionButtonActive]}
                    onPress={() => handleSortChange("oldest")}
                  >
                    <Text style={[styles.optionText, sortOption === "oldest" && styles.optionTextActive]}>Oldest</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsRow}>
                <Text style={styles.sectionTitle}>Filter by:</Text>
                  <TouchableOpacity
                    style={[styles.optionButton, filterOption === "all" && styles.optionButtonActive]}
                    onPress={() => handleFilterChange("all")}
                  >
                    <Text style={[styles.optionText, filterOption === "all" && styles.optionTextActive]}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, filterOption === "completed" && styles.optionButtonActive]}
                    onPress={() => handleFilterChange("completed")}
                  >
                    <Text style={[styles.optionText, filterOption === "completed" && styles.optionTextActive]}>Completed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, filterOption === "cancelled" && styles.optionButtonActive]}
                    onPress={() => handleFilterChange("cancelled")}
                  >
                    <Text style={[styles.optionText, filterOption === "cancelled" && styles.optionTextActive]}>Cancelled</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {orders.length === 0 && filterOption !== "all" ? (
                <Text style={styles.noOrdersMessage}>No orders match the selected filter.</Text>
              ) : (
                <FlatList
                  data={orders}
                  keyExtractor={(item) => item.id}
                  renderItem={renderOrderItem}
                  contentContainerStyle={styles.scrollContainer}
                  ListFooterComponent={renderOrderDetails()}
                />
              )}
            </>
          )}
        </>
      )}
    </View>
  );   
}
const styles = StyleSheet.create({
  // Layout containers
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },

  // Order card
  orderItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDetails: {
    marginTop: 12,
  },
  orderInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  // Modal styles
  modalContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  modalTitle: {
    marginTop: 50,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modalSectionTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalInfo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },

  // Restaurant grouping
  restaurantContainer: {
    marginVertical: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  restaurantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  // Order items inside modal
  orderItemRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },

  // Filter and sorting 
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  optionButtonActive: {
    backgroundColor: '#00BFA6',
    borderColor: '#00BFA6',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // Other styles...
  noOrdersMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default withRoleProtection(OrderHistoryScreen, ["student"]);
