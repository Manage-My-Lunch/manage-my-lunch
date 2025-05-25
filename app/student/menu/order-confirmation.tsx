import { useCart } from "@/lib/cart";
import { router } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";

export default function OrderConfirmation() {
    const { items, total, discountAmount, finalTotal, vouchersUsed } =
        useCart();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Order Confirmation</Text>
            <Text style={styles.sectionTitle}>Items:</Text>
            {items.length === 0 ? (
                <Text style={styles.empty}>No items in your order.</Text>
            ) : (
                items.map((restaurant) => (
                    <View key={restaurant.id} style={styles.restaurantSection}>
                        <Text style={styles.restaurantName}>
                            {restaurant.name}
                        </Text>
                        {restaurant.items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQuantity}>
                                    x{item.quantity}
                                </Text>
                                <Text style={styles.itemPrice}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ))
            )}
            <View style={styles.summarySection}>
                <Text style={styles.summaryText}>
                    Subtotal: ${total.toFixed(2)}
                </Text>
                <Text style={styles.summaryText}>
                    Vouchers Used: {vouchersUsed}
                </Text>
                <Text style={styles.summaryText}>
                    Discount: -${discountAmount.toFixed(2)}
                </Text>
                <Text style={styles.summaryTextTotal}>
                    Total: ${finalTotal.toFixed(2)}
                </Text>
            </View>
            <Text style={styles.thankYou}>Thank you for your order!</Text>
            <TouchableOpacity
                style={styles.homeButton}
                onPress={() => router.push("/student/menu")}
            >
                <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: "#fff",
        flexGrow: 1,
    },
    heading: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 8,
    },
    empty: {
        fontSize: 16,
        color: "#888",
        marginBottom: 16,
    },
    restaurantSection: {
        marginBottom: 16,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
        paddingLeft: 8,
    },
    itemName: {
        fontSize: 16,
        flex: 2,
    },
    itemQuantity: {
        fontSize: 16,
        flex: 1,
        textAlign: "center",
    },
    itemPrice: {
        fontSize: 16,
        flex: 1,
        textAlign: "right",
    },
    summarySection: {
        marginTop: 24,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        paddingTop: 16,
    },
    summaryText: {
        fontSize: 16,
        marginBottom: 4,
    },
    summaryTextTotal: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 8,
    },
    thankYou: {
        marginTop: 32,
        fontSize: 18,
        textAlign: "center",
        color: "#00BFA6",
        fontWeight: "600",
    },
    homeButton: {
        marginTop: 8,
        backgroundColor: "#00BFA6",
        borderRadius: 8,
        padding: 8,
    },
    homeButtonText: {
        color: "white",
        fontSize: 24,
        fontWeight: 700,
        textAlign: "center",
    },
});
