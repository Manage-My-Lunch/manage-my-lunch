import { Platform, View, Text, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { CartProvider } from "@/lib/cart";

const TabsLayout = () => {
    return (
        <CartProvider>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#00BFA6",
                    tabBarInactiveTintColor: "#gray",
                    tabBarStyle: {
                        position:
                            Platform.OS === "web" ? "absolute" : "relative",
                        bottom: Platform.OS === "web" ? "auto" : 0,
                        top: Platform.OS === "web" ? 0 : "auto",
                        backgroundColor: "#F7F9FC",
                    },
                }}
            >
                <Tabs.Screen
                    name="menu"
                    options={{
                        tabBarLabel: "Home",
                        tabBarIcon: ({ color }) => (
                            <Entypo name="home" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarLabel: "Profile",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="person" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="checkout"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </CartProvider>
    );
};

export default TabsLayout;
