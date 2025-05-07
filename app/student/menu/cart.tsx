import Heading from "@/components/heading";
import { useCart } from "@/lib/cart";
import { MenuItemType, UserProfile } from "@/lib/types";
import { router } from "expo-router";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
    Button,
    TextInput,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Platform,
    Keyboard,
    ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Cart() {
    const {
        items,
        addItem,
        removeItem,
        setComment: setCartComment,
        total,
        totalItems,
        removeAllItems,
        vouchersUsed,
        setVouchersUsed,
        discountAmount,
        finalTotal,
        completeOrder,
    } = useCart();

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [voucherModalVisible, setVoucherModalVisible] = useState(false);
    const [maxVouchers, setMaxVouchers] = useState(0);
    const [tempVouchersUsed, setTempVouchersUsed] = useState(0);
    const [comment, setComment] = useState("");

    const priceFormat = new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency: "NZD",
    });

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

    const handleCompleteOrder = async () => {
        try {
            await completeOrder();
        } catch (error) {
            console.error("Failed to complete order " + error);
            Alert.alert("Failed to complete order: " + error);
        }
    };

    // Fetch user profile to get available vouchers
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // Get the current user from Supabase auth
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error("Error fetching user:", userError);
                    setLoading(false);
                    return;
                }

                // Get the user's profile from the user table
                const { data, error } = await supabase
                    .from("user")
                    .select("id, points, voucher_count")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    console.error("Error fetching user profile:", error);
                } else {
                    setUserProfile(data as UserProfile);
                    setMaxVouchers(data.voucher_count || 0);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleOpenVoucherModal = () => {
        // Initialize temporary voucher count to the current used vouchers
        setTempVouchersUsed(vouchersUsed);
        setVoucherModalVisible(true);
    };

    const handleApplyVouchers = () => {
        // Apply temporary voucher count to the actual state
        setVouchersUsed(tempVouchersUsed);
        setVoucherModalVisible(false);
    };

    const handleCancelVouchers = () => {
        // Ignore this adjustment and close the modal
        setVoucherModalVisible(false);
        // Reset temporary voucher count (optional, as it will be reinitialized next time)
        setTempVouchersUsed(vouchersUsed);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await setCartComment(comment);
            router.push("/student/checkout");
        } catch (error) {
            Alert.alert("Failed to finalise order", `${error}`);
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.body}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            onPointerDown={Keyboard.dismiss}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
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
                                <Text
                                    style={{
                                        textAlign: "right",
                                        color: "#d00",
                                    }}
                                >
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
                                        <Heading size={3}>
                                            {restaurant.name}
                                        </Heading>
                                        {restaurant.items.map((item) => {
                                            return (
                                                <View
                                                    style={{
                                                        backgroundColor: "#ddd",
                                                        display: "flex",
                                                        justifyContent:
                                                            "flex-start",
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
                                                            alignItems:
                                                                "center",
                                                            flexDirection:
                                                                "row",
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
                                                                flexDirection:
                                                                    "column",
                                                                flexShrink: 1,
                                                            }}
                                                        >
                                                            <Heading size={4}>
                                                                {item.name}
                                                            </Heading>
                                                            <Text>
                                                                ${item.price}
                                                            </Text>
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
                                                                textAlign:
                                                                    "right",
                                                            }}
                                                        >
                                                            {priceFormat.format(
                                                                item.price *
                                                                    item.quantity
                                                            )}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                            <Text>
                                <Heading size={4}>Total items:</Heading>{" "}
                                {totalItems}
                            </Text>
                            <Text>
                                <Heading size={4}>Total:</Heading>{" "}
                                {priceFormat.format(total)}
                            </Text>
                            {userProfile && userProfile.voucher_count > 0 && (
                                <View style={styles.voucherSection}>
                                    <Text style={styles.voucherInfo}>
                                        You have {userProfile.voucher_count}{" "}
                                        voucher(s) available
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.voucherButton}
                                        onPress={handleOpenVoucherModal}
                                    >
                                        <Text style={styles.voucherButtonText}>
                                            {vouchersUsed > 0
                                                ? `${vouchersUsed} Voucher(s) Applied`
                                                : "Use Vouchers"}
                                        </Text>
                                    </TouchableOpacity>

                                    {vouchersUsed > 0 && (
                                        <View style={styles.discountInfo}>
                                            <Text style={styles.discountText}>
                                                Discount:{" "}
                                                {priceFormat.format(
                                                    -discountAmount
                                                )}
                                            </Text>
                                            <Text style={styles.finalTotalText}>
                                                Final Total:{" "}
                                                {priceFormat.format(finalTotal)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <Heading size={3} style={{ marginTop: 16 }}>
                                Order Comments:
                            </Heading>
                            <TextInput
                                style={{
                                    backgroundColor: "white",
                                    borderColor: "black",
                                    borderWidth: 1,
                                    padding: 10,
                                }}
                                placeholder="Put any comments here..."
                                editable
                                multiline
                                numberOfLines={3}
                                maxLength={250}
                                onChangeText={(text) => setComment(text)}
                                value={comment}
                            ></TextInput>
                            {!loading ? (
                                <TouchableOpacity
                                    style={styles.completeOrderButton}
                                    onPress={handleSubmit}
                                >
                                    <Text
                                        style={styles.completeOrderButtonText}
                                    >
                                        Complete Order
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <ActivityIndicator />
                            )}

                            {/* Voucher Selection Modal */}
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={voucherModalVisible}
                                onRequestClose={() =>
                                    setVoucherModalVisible(false)
                                }
                            >
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <Text style={styles.modalTitle}>
                                            Use Vouchers
                                        </Text>

                                        <Text style={styles.modalText}>
                                            You have{" "}
                                            {userProfile?.voucher_count || 0}{" "}
                                            voucher(s) available. Each voucher
                                            gives you $15 off your order.
                                        </Text>

                                        <View style={styles.voucherSelector}>
                                            <Button
                                                title="-"
                                                onPress={() =>
                                                    setTempVouchersUsed(
                                                        Math.max(
                                                            0,
                                                            tempVouchersUsed - 1
                                                        )
                                                    )
                                                }
                                                disabled={tempVouchersUsed <= 0}
                                            />
                                            <Text style={styles.voucherNumber}>
                                                {tempVouchersUsed}
                                            </Text>
                                            <Button
                                                title="+"
                                                onPress={() =>
                                                    setTempVouchersUsed(
                                                        Math.min(
                                                            maxVouchers,
                                                            tempVouchersUsed + 1
                                                        )
                                                    )
                                                }
                                                disabled={
                                                    tempVouchersUsed >=
                                                        maxVouchers ||
                                                    tempVouchersUsed * 15 >=
                                                        total
                                                }
                                            />
                                        </View>

                                        <Text style={styles.costText}>
                                            Discount: ${tempVouchersUsed * 15}
                                        </Text>
                                        <Text style={styles.costText}>
                                            New Total: $
                                            {Math.max(
                                                0,
                                                total - tempVouchersUsed * 15
                                            )}
                                        </Text>

                                        <View style={styles.modalButtons}>
                                            <Button
                                                title="Cancel"
                                                onPress={handleCancelVouchers}
                                            />
                                            <Button
                                                title="Apply"
                                                onPress={handleApplyVouchers}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        </>
                    ) : (
                        <>
                            <Text style={{ textAlign: "center" }}>
                                Your cart is empty.
                            </Text>
                        </>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    voucherSection: {
        marginTop: 16,
        padding: 12,
        backgroundColor: "#f0fffc",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#00BFA6",
    },
    voucherInfo: {
        fontSize: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    voucherButton: {
        backgroundColor: "#00BFA6",
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
    },
    voucherButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    discountInfo: {
        marginTop: 12,
        padding: 8,
        backgroundColor: "#e6fff9",
        borderRadius: 6,
    },
    discountText: {
        fontSize: 16,
        color: "#00BFA6",
        fontWeight: "bold",
    },
    finalTotalText: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 8,
        padding: 20,
        width: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        borderColor: "#00BFA6",
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#00BFA6",
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
    },
    voucherSelector: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    voucherNumber: {
        fontSize: 24,
        fontWeight: "bold",
        marginHorizontal: 20,
    },
    costText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 8,
        fontWeight: "bold",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 16,
    },
});
