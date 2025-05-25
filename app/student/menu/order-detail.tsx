import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Button,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { markOrderAsCollected } from "@/lib/orders";
import alert from "@/components/alert";

/**
 * Type definition for pickup window information
 * Contains time window and collection point details
 */
type PickupWindow = {
    id: string;
    open: string;
    close: string;
    collection_point?: {
        id: string;
        name: string;
    };
};

/**
 * Order type definition representing a complete food order
 * with all necessary details for display and interaction
 */
type Order = {
    id: string;
    created_at: string;
    accepted_at: string | null;
    ready_at: string | null;
    collected_at: string | null;
    completed_at: string | null;
    total_items: number;
    total_cost: number;
    pickup_pin?: string;
    stripe_payment_intent?: string;
    restaurant_info?: {
        id: string;
        name: string;
        location: string;
    };
    pickup_window?: PickupWindow;
};

/**
 * Order item type definition representing a single item in an order
 * with quantity and pricing information
 */
type OrderItem = {
    id: string;
    order: string;
    item: {
        id: string;
        name: string;
        price: number;
        description: string;
    };
    quantity: number;
    line_total: number;
};

export default function OrderDetailScreen() {
    const router = useRouter();
    const rawParams = useLocalSearchParams();
    const orderId = Array.isArray(rawParams.orderId)
        ? rawParams.orderId[0]
        : rawParams.orderId;

    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pickupPin, setPickupPin] = useState<string | null>(null);
    const [generatingPin, setGeneratingPin] = useState(false);
    const [collecting, setCollecting] = useState(false);

    useEffect(() => {
        /**
         * Formats location data from various formats into a human-readable string
         * @param loc - Location data in various formats (GeoJSON Point, PostGIS Point, or string)
         * @returns Formatted location string
         */
        const formatLocation = (loc: any) => {
            if (!loc) return "Not specified";

            // Handle GeoJSON Point format
            if (loc.type === "Point" && Array.isArray(loc.coordinates)) {
                const [lng, lat] = loc.coordinates;
                return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Display as latitude, longitude
            }

            // Handle PostGIS Point format with x,y coordinates
            if (loc.x && loc.y)
                return `${loc.y.toFixed(6)}, ${loc.x.toFixed(6)}`;

            // Handle string format (EWKB/WKT/address)
            if (typeof loc === "string") return loc;

            return "Not specified";
        };

        /**
         * Fetches complete order details including nested relationships in a single query
         * @param orderId - UUID of the order to fetch
         */
        const fetchOrderDetails = async (orderId: string) => {
            if (!orderId) {
                setError("Order ID is required");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Fetch all data in a single query with nested joins for efficiency
                const { data: orderData, error: orderError } = await supabase
                    .from("order")
                    .select(
                        `
            id, created_at, accepted_at, ready_at, collected_at, completed_at,
            total_items, total_cost, stripe_payment_intent,
            pickup_pin,
            pickup_window(
              id, open, close,
              collection_point(id, name)
            ),
            order_item(
              id, quantity, line_total,
              item:item(
                id, name, price, description,
                restaurant(id, name, location)
              )
            )
          `
                    )
                    .eq("id", orderId)
                    .single();

                if (orderError) {
                    console.error("Error fetching order details:", orderError);
                    setError(orderError.message);
                    setLoading(false);
                    return;
                }

                /**
                 * Process order items from the nested query result
                 * Handles different data structures that might come from the API
                 */
                const processedItems = [];

                // Process order items if they exist
                if (
                    Array.isArray(orderData.order_item) &&
                    orderData.order_item.length > 0
                ) {
                    for (const oi of orderData.order_item) {
                        // Extract item data safely with fallbacks for different response formats
                        let itemData = null;
                        if (oi.item) {
                            // Handle both array and direct object formats from the API
                            if (Array.isArray(oi.item)) {
                                itemData = oi.item[0];
                            } else {
                                itemData = oi.item;
                            }
                        }

                        // Create a normalized order item with fallbacks for missing data
                        processedItems.push({
                            id: oi.id,
                            order: orderId,
                            quantity: oi.quantity || 1,
                            line_total: oi.line_total || 0,
                            item: {
                                id: itemData?.id || "unknown",
                                name: itemData?.name || "Unknown Item",
                                price:
                                    itemData?.price ||
                                    oi.line_total / (oi.quantity || 1),
                                description: itemData?.description || "",
                            },
                        });
                    }
                }

                /**
                 * Extract restaurant information from the first order item
                 * This handles different data structures that might come from the API
                 */
                let restaurant = null;
                if (
                    Array.isArray(orderData.order_item) &&
                    orderData.order_item.length > 0
                ) {
                    const firstItem = orderData.order_item[0];
                    if (firstItem.item) {
                        // Handle both array and direct object formats
                        const itemData = Array.isArray(firstItem.item)
                            ? firstItem.item[0]
                            : firstItem.item;
                        if (itemData && itemData.restaurant) {
                            // Handle both array and direct object formats for restaurant
                            restaurant = Array.isArray(itemData.restaurant)
                                ? itemData.restaurant[0]
                                : itemData.restaurant;
                        }
                    }
                }

                /**
                 * Process pickup window and collection point information
                 * Normalizes the data structure for consistent access in the UI
                 */
                let formattedPickupWindow: PickupWindow | undefined = undefined;
                if (orderData.pickup_window) {
                    // Handle both array and direct object formats
                    const pickupWindowData = Array.isArray(
                        orderData.pickup_window
                    )
                        ? orderData.pickup_window[0]
                        : orderData.pickup_window;

                    if (pickupWindowData) {
                        formattedPickupWindow = {
                            id: pickupWindowData.id,
                            open: pickupWindowData.open,
                            close: pickupWindowData.close,
                            collection_point: undefined,
                        };

                        // Process collection point data if available
                        if (pickupWindowData.collection_point) {
                            const collectionPointData = Array.isArray(
                                pickupWindowData.collection_point
                            )
                                ? pickupWindowData.collection_point[0]
                                : pickupWindowData.collection_point;

                            if (collectionPointData) {
                                formattedPickupWindow.collection_point = {
                                    id: collectionPointData.id,
                                    name: collectionPointData.name,
                                };
                            }
                        }
                    }
                }

                /**
                 * Format restaurant data with human-readable location
                 */
                const formattedRestaurant = restaurant
                    ? {
                          id: restaurant.id,
                          name: restaurant.name,
                          location: restaurant.location
                              ? formatLocation(restaurant.location)
                              : "Not specified",
                      }
                    : undefined;

                /**
                 * Create the final order object with all processed data
                 * This combines the raw order data with the processed relationships
                 */
                const orderWithRestaurant = {
                    ...orderData,
                    pickup_window: formattedPickupWindow,
                    restaurant_info: formattedRestaurant,
                };

                // Update component state with processed data
                setOrderItems(processedItems);
                setOrder(orderWithRestaurant);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError("Failed to fetch order details");
            } finally {
                setLoading(false);
            }
        };

        if (orderId && typeof orderId === "string") {
            fetchOrderDetails(orderId);
        }
    }, [orderId]);

    /**
     * Formats a date string into a human-readable format
     * @param dateString - ISO date string to format
     * @returns Formatted date and time string
     */
    const formatOrderDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
    };

    /**
     * Determines the current status of an order based on its timestamps
     * @param order - Order object to check status
     * @returns Status string: 'collected', 'ready', 'preparing', or 'pending'
     */
    const getOrderStatus = (order: Order) => {
        if (order.collected_at) return "collected";
        if (order.ready_at) return "ready";
        if (order.accepted_at) return "preparing";
        return "pending";
    };

    /**
     * Marks the current order as collected by the user
     * Updates both the database and local state
     */
    const handleCollectOrder = async () => {
        if (!order || !orderId) return;

        try {
            setCollecting(true);

            // Call the API function to mark the order as collected
            const success = await markOrderAsCollected(orderId as string);

            if (success) {
                // Update local order state with collection timestamps
                setOrder({
                    ...order,
                    collected_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                });

                // Show success message and navigate back to orders list
                Alert.alert(
                    "Order Collected",
                    "Your order has been marked as collected. Thank you!",
                    [
                        {
                            text: "OK",
                            onPress: () => router.push("/student/menu/orders"),
                        },
                    ]
                );
            } else {
                alert(
                    "Error",
                    "Failed to mark order as collected. Please try again."
                );
            }
        } catch (error) {
            console.error("Error collecting order:", error);
            alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setCollecting(false);
        }
    };

    /**
     * Generates a 6-digit pickup PIN for the current order
     * Saves the PIN to the database and updates local state
     */
    const handleGeneratePin = async () => {
        // Validate order status before generating PIN
        if (!order || getOrderStatus(order) !== "ready") {
            alert(
                "Cannot generate PIN",
                "PIN can only be generated when your order is ready for pickup"
            );
            return;
        }

        // If PIN already exists, just show it
        if (order.pickup_pin) {
            alert("Pickup PIN", `Your PIN is ${order.pickup_pin}`);
            return;
        }

        try {
            setGeneratingPin(true);

            // Generate a random 6-digit PIN
            const pin = Math.floor(100000 + Math.random() * 900000).toString();

            // Save PIN to database
            const { error } = await supabase
                .from("order")
                .update({ pickup_pin: pin })
                .eq("id", order.id);

            if (error) {
                throw error;
            }

            // Update local state with the new PIN
            setOrder({ ...order, pickup_pin: pin });
            setPickupPin(pin);
        } catch (err: any) {
            console.error(err);
            alert("Error", err.message ?? "Failed to generate pickup PIN.");
        } finally {
            setGeneratingPin(false);
        }
    };

    // Loading state UI
    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#00BFA6" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    // Error state UI
    if (error) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Empty state UI when order not found
    if (!order) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.errorText}>Order not found</Text>
            </View>
        );
    }

    const handleCancelOrder = async () => {
        alert(
            "Cancel Order",
            "Are you sure you want to cancel this order? You will be fully refunded.",
            [
                {
                    text: "No",
                    style: "cancel",
                    onPress: () => {},
                },
                {
                    text: "Yes, Cancel Order",
                    style: "destructive",
                    onPress: async () => {
                        const { data, error } = await supabase.functions.invoke(
                            "refund-stripe-payment",
                            {
                                body: {
                                    paymentIntent: order.stripe_payment_intent,
                                },
                            }
                        );

                        console.log(data);
                        console.log(error);

                        if (error !== null) {
                            alert(
                                "Error",
                                "Failed to cancel order: " + error.message
                            );
                            return;
                        }

                        const { error: cancelError } = await supabase
                            .from("order")
                            .update({
                                cancelled_at: new Date().toISOString(),
                            })
                            .eq("id", order.id);

                        console.log(cancelError);

                        if (cancelError) {
                            alert(
                                "Error",
                                "Failed to cancel order: " + cancelError.message
                            );
                            return;
                        }

                        router.back();
                    },
                },
            ]
        );
    };

    const getOrderCancelTime = () => {
        if (order.pickup_window === undefined) {
            return new Date();
        }
        const d = new Date(order.pickup_window?.open);
        d.setHours(9, 0, 0, 0);
        return d;
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.orderCard}>
                    <Text style={styles.sectionTitle}>Restaurant</Text>
                    <Text style={styles.restaurantName}>
                        {order.restaurant_info?.name || "Unknown Restaurant"}
                    </Text>
                    <Text style={styles.orderTime}>
                        Ordered: {formatOrderDate(order.created_at)}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Status</Text>
                    <View style={styles.statusContainer}>
                        <Text
                            style={[
                                styles.statusText,
                                getOrderStatus(order) === "ready"
                                    ? styles.readyStatus
                                    : styles.preparingStatus,
                            ]}
                        >
                            {getOrderStatus(order) === "ready"
                                ? "Ready for pickup"
                                : "Preparing"}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {orderItems.map((orderItem) => (
                        <View key={orderItem.id} style={styles.itemRow}>
                            <Text style={styles.itemName}>
                                {orderItem.quantity}x{" "}
                                {orderItem.item?.name || "Unknown Item"}
                            </Text>
                            <Text style={styles.itemPrice}>
                                ${orderItem.line_total.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalAmount}>
                            ${order.total_cost.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Pickup Information</Text>
                    <Text style={styles.infoText}>
                        Location:{" "}
                        {order.pickup_window?.collection_point?.name ??
                            order.restaurant_info?.location ??
                            "Not specified"}
                    </Text>

                    {order.pickup_window ? (
                        <Text style={styles.pickupTimeInfo}>
                            Pickup Window:{" "}
                            {formatOrderDate(order.pickup_window.open)} -{" "}
                            {formatOrderDate(order.pickup_window.close)}
                        </Text>
                    ) : (
                        <Text style={styles.pickupTimeInfo}>
                            No pickup window assigned
                        </Text>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Pickup Code</Text>
                    {getOrderStatus(order) === "collected" ? (
                        <View style={styles.collectedContainer}>
                            <Text style={styles.collectedText}>
                                Order has been collected
                            </Text>
                            <Text style={styles.collectedTime}>
                                Collected at:{" "}
                                {formatOrderDate(order.collected_at || "")}
                            </Text>
                        </View>
                    ) : order.pickup_pin ? (
                        <View style={styles.pinContainer}>
                            <Text style={styles.pinLabel}>Your PIN:</Text>
                            <Text style={styles.pinCode}>
                                {order.pickup_pin}
                            </Text>
                            <Text style={styles.pinInstructions}>
                                Show this code to the restaurant staff when
                                collecting your order
                            </Text>

                            <View style={styles.collectButton}>
                                <Button
                                    title={
                                        collecting
                                            ? "Processing..."
                                            : "Mark as Collected"
                                    }
                                    onPress={handleCollectOrder}
                                    disabled={collecting}
                                    color="#00BFA6"
                                />
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.placeholderText}>
                                Generate a one-time PIN to collect your order
                            </Text>
                            <Button
                                title={
                                    generatingPin
                                        ? "Generating..."
                                        : "Generate Pickup PIN"
                                }
                                onPress={handleGeneratePin}
                                disabled={
                                    generatingPin ||
                                    getOrderStatus(order) !== "ready"
                                }
                                color="#00BFA6"
                            />
                            {getOrderStatus(order) !== "ready" && (
                                <Text style={styles.pinWarning}>
                                    PIN can only be generated when order is
                                    ready for pickup
                                </Text>
                            )}
                        </View>
                    )}
                    {order.pickup_window !== undefined &&
                        getOrderCancelTime().getTime() >
                            new Date().getTime() && (
                            <>
                                <View style={styles.divider} />
                                <View>
                                    <Button
                                        onPress={handleCancelOrder}
                                        title="Cancel Order"
                                        color="red"
                                    ></Button>
                                </View>
                            </>
                        )}
                </View>
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
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        padding: 24,
        minHeight: 300,
    },

    // Status indicators
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    errorText: {
        fontSize: 16,
        color: "red",
        textAlign: "center",
        padding: 16,
    },

    // Order card styling
    orderCard: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#f0f0f0",
        marginVertical: 16,
    },

    // Section headers
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    orderTime: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },

    // Order status
    statusContainer: {
        marginTop: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "500",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        overflow: "hidden",
        alignSelf: "flex-start",
    },
    readyStatus: {
        backgroundColor: "#e6f7f2",
        color: "#00BFA6", // App theme color
    },
    preparingStatus: {
        backgroundColor: "#fff4e6",
        color: "#f5a623",
    },

    // Order items
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    itemName: {
        fontSize: 14,
        color: "#333",
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },

    // Order total
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
    },

    // Information text
    infoText: {
        fontSize: 14,
        color: "#333",
        lineHeight: 22,
    },
    placeholderText: {
        fontSize: 14,
        color: "#666",
        fontStyle: "italic",
        marginTop: 8,
        marginBottom: 16,
    },
    pickupTimeInfo: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
        fontStyle: "italic",
    },

    // PIN related styles
    pinContainer: {
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f0f9f6",
        borderRadius: 8,
        marginTop: 8,
    },
    pinLabel: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    pinCode: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#00BFA6", // App theme color
        letterSpacing: 8,
        marginBottom: 16,
    },
    pinInstructions: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
    pinWarning: {
        fontSize: 12,
        color: "#f5a623",
        marginTop: 8,
        textAlign: "center",
    },
    collectButton: {
        marginTop: 16,
    },

    // Collected order state
    collectedContainer: {
        alignItems: "center",
        padding: 16,
        backgroundColor: "#f0f9f6",
        borderRadius: 8,
        marginTop: 8,
    },
    collectedText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#00BFA6", // App theme color
        marginBottom: 8,
    },
    collectedTime: {
        fontSize: 14,
        color: "#666",
    },
});
