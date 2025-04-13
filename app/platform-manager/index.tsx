import { Text, View, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

//could be moved to a .ts file
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
  pickup_window: string | null;
  comments: string | null;
  points_redeemed: number;
  points_earned: number;
};

export default function Index() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from("order")
            .select("*");

        if (error) throw error;

        const sortedData = data;

        setOrders(sortedData);
        console.log("Fetched orders:", data);
    } catch (error) {
        console.error("Error fetching orders:", error);
    } finally {
        setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>Order ID: {item.id}</Text>
      <Text style={styles.itemText}>Total: ${item.total_cost?.toFixed(2)}</Text>
      <Text style={styles.itemText}>Items: {item.total_items}</Text>
      <Text style={styles.itemText}>Created: {new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Home</Text>
      </Pressable>


      {loading ? (
        <ActivityIndicator size="large" color="#00BFA6" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#00BFA6",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 8,
    margin: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    width: "90%",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  list: {
    padding: 10,
  }
});
