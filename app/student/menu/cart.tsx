import Heading from "@/components/heading";
import { useCart } from "@/lib/cart";
import { MenuItemType } from "@/lib/types";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
} from "react-native";

export default function Cart() {
    const { items, addItem, removeItem, total, totalItems, removeAllItems } =
        useCart();

    const handleAddItem = async (item: MenuItemType) => {
        try {
            await addItem(item, 1);
        } catch (error) {
            console.error("Failed to update item quantity: " + error);
            Alert.alert("Failed to update item quantity: " + error);
        }
    };

    const handleRemoveItem = async (item: MenuItemType) => {
        try {
            await removeItem(item, 1);
        } catch (error) {
            console.error("Failed to update item quantity: " + error);
            Alert.alert("Failed to update item quantity: " + error);
        }
    };

    const handleRemoveAllItems = async () => {
        try {
            await removeAllItems();
        } catch (error) {
            console.error("Failed to update item quantity: " + error);
            Alert.alert("Failed to update item quantity: " + error);
        }
    };

    return (
        <View style={styles.body}>
            <View
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                }}
            >
                <Heading size={1} style={{ width: "50%" }}>
                    Your Cart
                </Heading>
                {totalItems > 0 && (
                    <TouchableOpacity
                        style={{ width: "50%" }}
                        onPress={handleRemoveAllItems}
                    >
                        <Text style={{ textAlign: "right", color: "#d00" }}>
                            Delete All Items
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {totalItems > 0 ? (
                <>
                    {items.map((restaurant) => {
                        return (
                            <View key={restaurant.id}>
                                <Heading size={3}>{restaurant.name}</Heading>
                                {restaurant.items.map((item) => {
                                    return (
                                        <View
                                            style={{
                                                backgroundColor: "#ddd",
                                                display: "flex",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                flexDirection: "row",
                                                marginVertical: 8,
                                            }}
                                            key={item.id}
                                        >
                                            <View
                                                style={{
                                                    width: "75%",
                                                    display: "flex",
                                                    justifyContent:
                                                        "flex-start",
                                                    alignItems: "center",
                                                    flexDirection: "row",
                                                }}
                                            >
                                                <Image
                                                    source={{
                                                        uri: item.image_url,
                                                    }}
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                    }}
                                                />
                                                <View
                                                    style={{
                                                        padding: 8,
                                                        flexDirection: "column",
                                                        flexShrink: 1,
                                                    }}
                                                >
                                                    <Heading size={4}>
                                                        {item.name}
                                                    </Heading>
                                                    <Text>${item.price}</Text>
                                                </View>
                                            </View>
                                            <View
                                                style={{
                                                    paddingEnd: 16,
                                                    width: "25%",
                                                }}
                                            >
                                                <View
                                                    style={
                                                        styles.quantityContainer
                                                    }
                                                >
                                                    <TouchableOpacity
                                                        style={
                                                            styles.quantityButton
                                                        }
                                                        onPress={async () =>
                                                            await handleRemoveItem(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.quantityButtonText
                                                            }
                                                        >
                                                            -
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <Text
                                                        style={
                                                            styles.quantityText
                                                        }
                                                    >
                                                        {item.quantity}
                                                    </Text>

                                                    <TouchableOpacity
                                                        style={
                                                            styles.quantityButton
                                                        }
                                                        onPress={async () =>
                                                            await handleAddItem(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.quantityButtonText
                                                            }
                                                        >
                                                            +
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <Text
                                                    style={{
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    $
                                                    {item.price * item.quantity}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                    <Text>
                        <Heading size={4}>Total items:</Heading> {totalItems}
                    </Text>
                    <Text>
                        <Heading size={4}>Total:</Heading> ${total}
                    </Text>
                    <TouchableOpacity style={styles.completeOrderButton}>
                        <Text style={styles.completeOrderButtonText}>
                            Complete Order
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={{ textAlign: "center" }}>
                        Your cart is empty.
                    </Text>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        padding: 16,
    },
    completeOrderButton: {
        marginTop: 8,
        backgroundColor: "black",
        borderRadius: 8,
        padding: 8,
    },
    completeOrderButtonText: {
        color: "white",
        fontSize: 24,
        fontWeight: 700,
        textAlign: "center",
    },
    quantityContainer: {
        justifyContent: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
        marginBottom: 20,
    },
    quantityButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 8,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: "bold",
    },
    quantityText: {
        fontWeight: "bold",
        paddingHorizontal: 4,
    },
});
