import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

/**
 * Order type definition representing a student's food order
 */
type Order = {
    id: string;
    created_at: string;
    updated_at: string;
    user: string;
    paid_at: string;
    accepted_at: string | null;
    ready_at: string | null;
    driver_collected_at: string | null;
    delivered_at: string | null;
    collected_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    total_cost: number;
    total_items: number;
    restaurant_name?: string;
};

export default function OrdersScreen() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetch orders for the currently authenticated user
     */
    useEffect(() => {
        async function fetchOrders() {
            try {
                setLoading(true);

                // Get the current authenticated user
                const { data: userData, error: userError } =
                    await supabase.auth.getUser();

                if (userError || !userData?.user) {
                    setError("User not authenticated");
                    return;
                }

                const userId = userData.user.id;

                // Fetch paid orders that are not completed yet
                const { data: ordersData, error: ordersError } = await supabase
                    .from("order")
                    .select("*")
                    .eq("user", userId)
                    .not("paid_at", "is", null)
                    .is("completed_at", null)
                    .order("created_at", { ascending: false });
                if (ordersError) {
                    setError(ordersError.message);
                    return;
                }

                if (!ordersData || ordersData.length === 0) {
                    setOrders([]);
                    setLoading(false);
                    return;
                }

                // For each order, we need to find a representative order item to get the restaurant name
                const ordersWithRestaurants = await Promise.all(
                    ordersData.map(async (order) => {
                        try {
                            // Get all order items and filter manually to avoid SQL issues with reserved 'order' keyword
                            const {
                                data: allOrderItems,
                                error: allItemsError,
                            } = await supabase.from("order_item").select("*");

                            if (allItemsError || !allOrderItems) {
                                return {
                                    ...order,
                                    restaurant_name: "Unknown Restaurant",
                                };
                            }

                            // Find items that belong to this order
                            const matchingItems = allOrderItems.filter(
                                (item) => item.order === order.id
                            );

                            if (matchingItems.length === 0) {
                                return {
                                    ...order,
                                    restaurant_name: "Unknown Restaurant",
                                };
                            }

                            // Get the first order item
                            const firstItem = matchingItems[0];

                            // Extract item ID
                            const itemId = firstItem.item;

                            if (!itemId) {
                                return {
                                    ...order,
                                    restaurant_name: "Unknown Restaurant",
                                };
                            }

                            // Try to get menu item details
                            let menuItem;

                            // First try menu_item table
                            const { data: menuItemData, error: menuItemError } =
                                await supabase
                                    .from("menu_item")
                                    .select("*")
                                    .eq("id", itemId)
                                    .single();

                            if (menuItemError || !menuItemData) {
                                // If menu_item fails, try item table
                                const { data: itemData, error: itemError } =
                                    await supabase
                                        .from("item")
                                        .select("*")
                                        .eq("id", itemId)
                                        .single();

                                if (itemError || !itemData) {
                                    return {
                                        ...order,
                                        restaurant_name: "Unknown Restaurant",
                                    };
                                }

                                menuItem = itemData;
                            } else {
                                menuItem = menuItemData;
                            }

                            // Get restaurant ID (handle both restaurant_id and restaurant field names)
                            const restaurantId =
                                menuItem.restaurant_id || menuItem.restaurant;

                            if (!restaurantId) {
                                return {
                                    ...order,
                                    restaurant_name: "Unknown Restaurant",
                                };
                            }

                            // Get restaurant name
                            const { data: restaurant, error: restaurantError } =
                                await supabase
                                    .from("restaurant")
                                    .select("name")
                                    .eq("id", restaurantId)
                                    .single();

                            // Return order with restaurant name if found
                            if (restaurant && restaurant.name) {
                                return {
                                    ...order,
                                    restaurant_name: restaurant.name,
                                };
                            } else {
                                return {
                                    ...order,
                                    restaurant_name: "Unknown Restaurant",
                                };
                            }
                        } catch (error) {
                            // Handle any unexpected errors
                            return {
                                ...order,
                                restaurant_name: "Unknown Restaurant",
                            };
                        }
                    })
                );

                setOrders(ordersWithRestaurants);
            } catch (err) {
                setError("Failed to fetch orders");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    /**
     * Format date string for display in a user-friendly format
     * @param dateString ISO date string to format
     * @returns Formatted time string
     */
    const formatOrderDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    /**
     * Navigate to order details screen when an order is selected
     * @param orderId UUID of the selected order
     */
    const handleOrderPress = (orderId: string) => {
        router.push({
            pathname: "/student/menu/order-detail",
            params: { orderId },
        });
    };

    /**
     * Determine the current status of an order based on its timestamps
     * @param order Order object to check status for
     * @returns Status string: 'ready', 'preparing', or 'pending'
     */
    const getOrderStatus = (order: Order) => {
        if (order.cancelled_at) return "cancelled";
        if (order.ready_at) return "ready";
        if (order.accepted_at) return "preparing";
        return "pending";
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00BFA6" />
                        <Text style={styles.loadingText}>
                            Loading orders...
                        </Text>
                    </View>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : orders.length === 0 ? (
                    <Text style={styles.placeholderText}>
                        You don't have any pending orders
                    </Text>
                ) : (
                    orders.map((order) => (
                        <TouchableOpacity
                            key={order.id}
                            style={styles.orderCard}
                            onPress={() => handleOrderPress(order.id)}
                        >
                            <View style={styles.orderHeader}>
                                <Text style={styles.restaurantName}>
                                    {order.restaurant_name ||
                                        "Unknown Restaurant"}
                                </Text>
                                <Text style={styles.orderTime}>
                                    {formatOrderDate(order.created_at)}
                                </Text>
                            </View>
                            <View style={styles.statusContainer}>
                                <View
                                    style={[
                                        styles.statusDot,
                                        getOrderStatus(order) === "cancelled"
                                            ? styles.cancelledStatus
                                            : getOrderStatus(order) === "ready"
                                            ? styles.readyStatus
                                            : getOrderStatus(order) ===
                                              "preparing"
                                            ? styles.preparingStatus
                                            : styles.pendingStatus,
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.statusText,
                                        getOrderStatus(order) === "cancelled"
                                            ? styles.cancelledText
                                            : getOrderStatus(order) === "ready"
                                            ? styles.readyText
                                            : getOrderStatus(order) ===
                                              "preparing"
                                            ? styles.preparingText
                                            : styles.pendingText,
                                    ]}
                                >
                                    {getOrderStatus(order) === "cancelled"
                                        ? "Cancelled"
                                        : getOrderStatus(order) === "ready"
                                        ? "Ready for pickup"
                                        : getOrderStatus(order) === "preparing"
                                        ? "Preparing"
                                        : "Order received"}
                                </Text>
                            </View>
                            <View style={styles.orderDetails}>
                                <Text style={styles.orderInfo}>
                                    {order.total_items} item
                                    {order.total_items !== 1 ? "s" : ""}
                                </Text>
                                <Text style={styles.orderInfo}>
                                    Total: ${order.total_cost.toFixed(2)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

/**
 * Component styles
 */
const styles = StyleSheet.create({
    // Layout containers
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 24,
        minHeight: 300,
    },

    // Loading state
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        minHeight: 300,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },

    // Message states
    errorText: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
        padding: 16,
    },
    placeholderText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },

    // Order card
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        width: "100%",
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    orderTime: {
        fontSize: 14,
        color: "#666",
    },

    // Order status
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
    },
    orderDetails: {
        marginTop: 12,
    },
    orderInfo: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },

    // Status colors
    cancelledStatus: {
        backgroundColor: "#ff3b30",
    },
    pendingStatus: {
        backgroundColor: "#f5a623",
    },
    preparingStatus: {
        backgroundColor: "#4a90e2",
    },
    readyStatus: {
        backgroundColor: "#7ed321",
    },
    cancelledText: {
        color: "#ff3b30",
    },
    pendingText: {
        color: "#f5a623",
    },
    preparingText: {
        color: "#4a90e2",
    },
    readyText: {
        color: "#7ed321",
    },
});
