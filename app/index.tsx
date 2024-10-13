import { Text, View, Button } from "react-native";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");

  useEffect(() => {
    fetchFirstRestaurant();
  }, []);

  const fetchFirstRestaurant = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant')
        .select('id, name')
        .limit(1)
        .single();

      if (error) throw error;
      setRestaurantId(data.id);
      setRestaurantName(data.name);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Welcome to {restaurantName || "Manage My Lunch"}!</Text>
      {restaurantId && (
        <Button
          title="View Restaurant Menu"
          onPress={() =>
            router.push({
              pathname: '/menu',
              params: { restaurantId: restaurantId },
            })
          }
        />
      )}
    </View>
  );
}
