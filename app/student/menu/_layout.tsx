// AppLayout.tsx
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
    SafeAreaView,
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart";

export default function AppLayout() {
    const router = useRouter();
    const { totalItems } = useCart();

    const BackButton = () => {
        return (
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        );
    };

    const CartButton = () => {
        return (
            <TouchableOpacity
                onPress={() => router.push("/student/menu/cart")}
                style={styles.cartButton}
            >
                <Ionicons name="cart" size={24} color="#fff" />
                {totalItems > 0 && (
                    <Text style={styles.cartButtonText}>{totalItems}</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: "Menu",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <Text style={styles.title}>
                                    {options.title}
                                </Text>

                                <CartButton />
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="restaurant"
                options={{
                    title: "Restaurant",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>

                                <CartButton />
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="detail"
                options={{
                    title: "Menu Item Details",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>

                                <CartButton />
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="cart"
                options={{
                    title: "Your Cart",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="payment"
                options={{
                    title: "Confirm Pickup & Pay",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="order-confirmation"
                options={{
                    title: "Order Confirmation",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <Text style={styles.title}>
                                    {options.title}
                                </Text>
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="orders"
                options={{
                    title: "Current Orders",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
            <Stack.Screen
                name="order-detail"
                options={{
                    title: "Order Details",
                    header: ({ route, options }) => (
                        <SafeAreaView style={styles.safeArea}>
                            <View style={styles.container}>
                                <BackButton />

                                <Text style={styles.title}>
                                    {options.title}
                                </Text>
                            </View>
                        </SafeAreaView>
                    ),
                }}
            />
        </Stack>
    );
}

const styles = StyleSheet.create({
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        marginLeft: 5,
    },
    cartButton: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
        position: "relative",
    },
    cartButtonText: {
        color: "#fff",
        backgroundColor: "#f00",
        borderRadius: 100,
        paddingHorizontal: 4,
        position: "absolute",
        right: -4,
        top: -4,
        minWidth: 16,
        textAlign: "center",
    },
    safeArea: {
        backgroundColor: "#00BFA6",
    },
    container: {
        height: Platform.OS === "web" ? 100 : 50, //might need adjustment on lower resolutions
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    title: {
        flex: 1,
        textAlign: "center",
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
});
