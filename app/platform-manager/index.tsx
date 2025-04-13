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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("order").select("*");
      
      if (error) throw error;
      
      //for future sorting
      const sortedData = data;

      setOrders(sortedData);
      console.log("Fetched orders:", data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.headerText]}>Order ID</Text>
      <Text style={[styles.headerText]}>Pickup Window</Text>
      <Text style={[styles.headerText]}>Delivered at</Text>
      <Text style={[styles.headerText]}>Collected at</Text>
      <Text style={[styles.headerText]}>Comments</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={styles.itemText}>{item.id}</Text>
        <Text style={styles.itemText}>{item.pickup_window}</Text>
        <Text style={styles.itemText}>
          {item.delivered_at ? new Date(item.delivered_at).toLocaleString() : "N/A"}
        </Text>
        <Text style={styles.itemText}>
          {item.collected_at ? new Date(item.collected_at).toLocaleString() : "N/A"}
        </Text>
        <Text style={styles.itemText}>{item.comments}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Pressable style={[styles.button, styles.homeButton]} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Home</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator size="large" color="#00BFA6" />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
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
    alignItems: "stretch",
    width: "100%",
  },

  homeButton: {
    alignSelf: "center",
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
    width: "100%",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "left",
  },
  list: {
    padding: 10,
    width: "100%",
  },
  headerRow: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    textAlign: "left",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

});
