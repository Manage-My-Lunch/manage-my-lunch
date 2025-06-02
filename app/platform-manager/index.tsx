import { Text, View, StyleSheet, Pressable, FlatList, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

//could be moved to a .ts file
type Order = {
  id: string;
  first_name: string;
  last_name: string;
  collection_point_name: string;
  pickup_open: string;
  pickup_close: string;
  delivered_at: string | null;
  collected_at: string | null;
  total_items: number;
  comments: string | null;
  pin: string;
};

function makeUnwrappable(str: string) {
  return str.replace(/ /g, "\u00A0").replace(/-/g, "\u2011");
}

export default function Index() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [baseFilteredOrders, setBaseFilteredOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchId, setSearchId] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [collectionPoints, setCollectionPoints] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState("All");

  const listRef = useRef<FlatList<Order>>(null);

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month:  'short',
    day:    'numeric',
    hour:   'numeric',
    minute: 'numeric',
    hour12: true,
  });

  useEffect(() => {
    fetchOrders(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const pts = Array.from(
      new Set(orders.map((o) => o.collection_point_name))
    ).sort();
    setCollectionPoints(["All", ...pts]);
    applyCollectionFilter(orders, selectedCollection);
  }, [orders]);

  useEffect(() => {
    applyCollectionFilter(orders, selectedCollection);
  }, [selectedCollection]);

  const fetchOrders = async (givenDate: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("fetch_orders", { given_date: givenDate });
      if (error) throw error;
      const uncollected = data.filter(
        (order: Order) => order.collected_at === null
      );
      setOrders(uncollected);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  function applyCollectionFilter(
    allOrders: Order[],
    collection: string
  ) {
    const base =
      collection === "All"
        ? allOrders
        : allOrders.filter((o) => o.collection_point_name === collection);
    setBaseFilteredOrders(base);
    setFilteredOrders(base);
  }

  const filterOrders = (searchName: string) => {
    const s = searchName.trim().toLowerCase();
    if (!s) {
      setFilteredOrders(baseFilteredOrders);
    } else {
      setFilteredOrders(
        baseFilteredOrders.filter((order) =>
          `${order.first_name} ${order.last_name}`
            .toLowerCase()
            .includes(s)
        )
      );
    }
  };

  const collectOrder = async (orderId: string) => {
    const { error } = await supabase.rpc("collect_order", {
      order_id: orderId,
    });
    if (error) {
      window.alert("Failed to confirm pickup.");
      return false;
    }
    return true;
  };

  const renderHeader = () => (
    <View style={[styles.row, styles.headerRow]}>
      <Text style={[styles.headerTextWide]}>Order User Name</Text>
      <Text style={[styles.headerTextWide]}>Collection Point</Text>
      <Text style={[styles.headerTextWide]}>Pickup Window</Text>
      <Text style={[styles.headerText, styles.centerText]}>Delivered?</Text>
      <Text style={[styles.headerText, styles.centerText]}>Total Items</Text>
      <Text style={[styles.headerTextWide]}>Comments</Text>
      <Text style={[styles.headerTextWide]}>Confirm</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Order }) => (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={styles.itemTextWide}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.itemTextWide}>
          {item.collection_point_name}
        </Text>
        <Text style={styles.itemTextWide}>
          {item.pickup_open
            ? makeUnwrappable(
                dateFormatter.format(new Date(item.pickup_open))
              )
            : "N/A"}
          <Text style={{ flexShrink: 0 }}>{"  -  "}</Text>
          {item.pickup_close
            ? makeUnwrappable(
                dateFormatter.format(new Date(item.pickup_close))
              )
            : "N/A"}
        </Text>
        <Text style={[styles.itemText, styles.centerText]}>
          {item.delivered_at ? "✔" : "✖"}
        </Text>
        <Text style={[styles.itemText, styles.centerText]}>{item.total_items}</Text>
        <Text style={styles.itemTextWide}>{item.comments ? item.comments : <i>None</i>}</Text>
        <View style={styles.itemTextWide}>
          <Pressable
              style={styles.button}
              onPress={async () => {
                const userPin = window.prompt(`Enter PIN for ${item.first_name} ${item.last_name}:`);

                if (userPin === null) return;

                if (userPin === item.pin) {
                  const confirm = window.confirm("PIN verified. Confirm pickup?");
                  if (confirm) {
                    const success = await collectOrder(item.id);
                    if (success) {
                      const today = new Date().toISOString().split("T")[0];
                      await fetchOrders(today);
                    }
                  }
                } else {
                  window.alert("Incorrect PIN.");
                }
              }
          }
          >
            <Text style={styles.buttonText}>Enter PIN</Text>
          </Pressable>
      </View>

      </View>
    </View>
  );

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      {/* existing button row unchanged */}
      <View style={styles.buttonRow}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/")}
        >
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/sales-report")}
        >
          <Text style={styles.buttonText}>Sales Report</Text>
        </Pressable>
      </View>

      {/* new filters row */}
      <View style={styles.filterRow}>
        {/* collection point dropdown */}
        <select
          value={selectedCollection}
          onChange={(e) =>
            setSelectedCollection(e.target.value)
          }
          style={styles.selectInput as any}
        >
          {collectionPoints.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>

        {/* date picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput as any}
        />
        {selectedDate === todayIso && (
          <Text style={styles.todayLabel}>Today</Text>
        )}
      </View>

      {/* search row unchanged */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter search details"
          value={searchId}
          onChangeText={setSearchId}
        />
        <Pressable style={styles.button} onPress={() => filterOrders(searchId) /* jumpToOrder(searchId) */}>
          <Text style={styles.buttonText}>Search Order</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00BFA6" />
      ) : (
        <FlatList
          ref={listRef}
          data={filteredOrders}
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 10,
  },
  selectInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    fontSize: 16,
    minWidth: 140,
  },
  dateInput: {
    padding: 8,
    fontSize: 16,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  todayLabel: {
    marginLeft: 6,
    fontSize: 16,
    fontStyle: "italic",
  },
  searchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    fontSize: 16,
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
  },
  centerText: {
    textAlign: "center",
  },
});
