import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "@/lib/cart";

export default function AppLayout() {
    const router = useRouter();
    const { totalItems } = useCart();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#00BFA6",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                    fontWeight: "bold",
                },
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.push("/student/menu/cart")}
                        style={styles.cartButton}
                    >
                        <Ionicons name="cart" size={24} color="#fff" />
                        {totalItems > 0 && (
                            <Text style={styles.cartButtonText}>
                                {totalItems}
                            </Text>
                        )}
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Menu",
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.push("/student")}
                            style={styles.backButton}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color="#fff"
                            />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen name="restaurant" options={{ title: "Restaurant" }} />
            <Stack.Screen
                name="detail"
                options={{ title: "Menu Item Details" }}
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
        borderRadius: "100%",
        paddingHorizontal: 4,
        right: -4,
        top: -4,
        fontWeight: 600,
        position: "absolute",
    },
});
