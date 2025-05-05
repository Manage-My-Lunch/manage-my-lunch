import { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import withRoleProtection from "../../components/withRoleProtection";
import CustomButton from "@/components/customButton";
import BusyToggle from "@/components/busyToggle";
import alert from "@/components/alert";

function RestaurantDashboard() {
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [toggling, setToggling] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [tempDailyLimit, setTempDailyLimit] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get the current logged in user
    const fetchRestaurantName = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      // Get the restaurant_id from restaurant_users table
      const { data: restaurantUser, error: restaurantUserError } = await supabase
        .from("restaurant_users")
        .select("restaurant_id")
        .eq("user_id", session.user.id)
        .single();

      if (restaurantUserError || !restaurantUser) {
        console.error("Error fetching restaurant ID:", restaurantUserError);
        setLoading(false);
        return;
      }
      
      // Fetch the restaurant name from restaurant table
      const { data: restaurant, error: restaurantError } = await supabase
        .from("restaurant")
        .select("name, is_busy, daily_limit")
        .eq("id", restaurantUser.restaurant_id)
        .single();

      if (restaurantError || !restaurant) {
        console.error("Error fetching restaurant name:", restaurantError);
        setLoading(false);
        return;
      }

      setRestaurantId(restaurantUser.restaurant_id);
      setRestaurantName(restaurant.name);
      setIsBusy(restaurant.is_busy);
      setDailyLimit(restaurant.daily_limit);
      setTempDailyLimit(restaurant.daily_limit?.toString() || "");
      setLoading(false);
    };

    fetchRestaurantName();
  }, []);

  // Handle setting max daily limit of orders
  const handleSaveDailyLimit = async () => {
    if (!restaurantId) return;
  
    // Check if input is a non-negative integer using regex
    if (!/^\d+$/.test(tempDailyLimit)) {
      alert("Error", "Please enter a valid whole number (0 or higher).");
      return;
    }
  
    const parsedLimit = parseInt(tempDailyLimit, 10);
  
    setSaving(true);

    // Update the daily limit
    const { error } = await supabase
      .from("restaurant")
      .update({ daily_limit: parsedLimit })
      .eq("id", restaurantId);
  
    if (error) {
      alert("Error", "Failed to update daily limit.");
      console.error("Update error:", error);
    }

    // Fetch current daily_orders count
    const { data: dailyOrderData, error: fetchDailyError } = await supabase
      .from("daily_orders")
      .select("orders_today")
      .eq("restaurant_id", restaurantId)
      .single();

    if (fetchDailyError || !dailyOrderData) {
      alert("Error", "Failed to fetch today's order count.");
      console.error("Fetch error:", fetchDailyError);
      setSaving(false);
      return;
    }

    const ordersToday = dailyOrderData.orders_today;

    // Fetch current busy status
    const { data: restaurantData, error: fetchRestaurantError } = await supabase
      .from("restaurant")
      .select("is_busy")
      .eq("id", restaurantId)
      .single();

    if (fetchRestaurantError || !restaurantData) {
      alert("Error", "Failed to fetch restaurant status.");
      console.error("Fetch error:", fetchRestaurantError);
      setSaving(false);
      return;
    }

    const currentBusy = restaurantData.is_busy;

    // Compare and update busy status if needed
    let newBusyStatus = currentBusy;

    if (ordersToday < parsedLimit && currentBusy) {
      // Unmark busy
      newBusyStatus = false;
    } else if (ordersToday >= parsedLimit && !currentBusy) {
      // Mark busy
      newBusyStatus = true;
    }

    if (newBusyStatus !== currentBusy) {
      const { error: busyError } = await supabase
        .from("restaurant")
        .update({ is_busy: newBusyStatus })
        .eq("id", restaurantId);

      if (busyError) {
        console.error("Failed to update busy status:", busyError);
      } else {
        setIsBusy(newBusyStatus);
      }
    }

    setDailyLimit(parsedLimit);
    alert("Success", "Daily order limit updated!");
    setSaving(false);
  };  

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout Error", error.message);
    } else {
      router.replace("/login");
      alert("Successfully logged out!", "");
    }
  };

  // Handle switching between open and closed
  const handleToggleBusy = async () => {
    if (!restaurantId) return;

    setToggling(true);
    const { error } = await supabase
      .from("restaurant")
      .update({ is_busy: !isBusy })
      .eq("id", restaurantId);

    if (error) {
      alert("Error", "Failed to update restaurant status.");
      console.error("Toggle error:", error);
    } else {
      setIsBusy((prev) => !prev);
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome to {restaurantName}!</Text>
        <BusyToggle isBusy={!!isBusy} onToggle={handleToggleBusy} disabled={toggling} />
      </View>

      <View style={styles.content}>
        <CustomButton title="View Today's Orders" onPress={() => router.push("/restaurant/orders")} />

        <View style={styles.limitSection}>
          <Text style={styles.label}>Maximum Daily Orders Limit:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={tempDailyLimit}
            onChangeText={setTempDailyLimit}
            placeholder="Enter daily limit"
          />
          <View style={styles.buttonRow}>
            <CustomButton title="Save" onPress={handleSaveDailyLimit} disabled={saving} />
            <CustomButton
              title="Cancel"
              onPress={() => setTempDailyLimit(dailyLimit?.toString() || "")}
            />
          </View>
        </View>

        <CustomButton title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
}

// Protect the component with role-based access for restaurants
export default withRoleProtection(RestaurantDashboard, ["restaurant"]);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    backgroundColor: "#00BFA6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    flexWrap: "wrap",
    marginRight: 10,
  },
  content: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  limitSection: {
    marginTop: 20,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: 200,
    fontSize: 16,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
});