import { Text, View, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

//could be moved to a .ts file
type Order = {
  id: string;
  collection_point_name: string;
  pickup_open: string;
  pickup_close: string;
  delivered_at: string | null;
  collected_at: string | null;
  total_items: number;
  comments: string | null;
};

export default function Index() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetchOrders(today);
  }, []);

  const fetchOrders = async (givenDate: string) => {
    try {
      setLoading(true);
      //adjust given_date argument when applying more sorting with more data!!!
      const { data, error } = await supabase.rpc('fetch_orders', { given_date: givenDate });
      
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
      <Text style={[styles.headerTextWide]}>Order ID</Text>
      <Text style={[styles.headerTextWide]}>Collection Point</Text>
      <Text style={[styles.headerTextWide]}>Pickup Window</Text>
      <Text style={[styles.headerText]}>Delivered?</Text>
      <Text style={[styles.headerText]}>Collected?</Text>
      <Text style={[styles.headerText]}>Total Items</Text>
      <Text style={[styles.headerTextWide]}>Comments</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={styles.itemTextWide}>{item.id}</Text>
        <Text style={styles.itemTextWide}>{item.collection_point_name}</Text>
        <Text style={styles.itemTextWide}>
          {item.pickup_open ? new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }).format(new Date(item.pickup_open)) : "N/A"}
          &nbsp;&nbsp;-&nbsp;&nbsp;
           {item.pickup_close ? new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }).format(new Date(item.pickup_close)) : "N/A"}
        </Text>
        <Text style={styles.itemText}>
          {item.delivered_at ? "✔" : "✖"}
        </Text>
        <Text style={styles.itemText}>
          {item.collected_at ? "✔" : "✖"}
        </Text>
        <Text style={styles.itemText}>{item.total_items}</Text>
        <Text style={styles.itemTextWide}>{item.comments ? item.comments : <i>None</i>}</Text>
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
  itemTextWide: {
    fontSize: 16,
    color: "#333",
    flex: 2,
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
  headerTextWide: {
    flex: 2,
    textAlign: "left",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  }

});
