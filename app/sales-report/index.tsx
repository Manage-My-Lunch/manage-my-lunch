import { Text, View, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SalesReport {
  total_orders: number;
  total_cost: number | null;
}

export default function Index() {
  const router = useRouter();
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);

  const fetchSalesReport = async (givenDate: string) => {
    try {
      const { data, error } = await supabase
        .rpc("fetch_sales_report", { given_date: givenDate });

      if (error) {
        console.error("Error fetching sales report:", error);
        setSalesReport(null);
      } else {
        setSalesReport(data[0]);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setSalesReport(null);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetchSalesReport(today);
  }, []);

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Home</Text>
      </Pressable>
      
      {salesReport ? (
        <>
          <Text>Total Orders: {salesReport.total_orders}</Text>
          <Text>Total Cost: {salesReport.total_cost !== null ? `$${salesReport.total_cost.toFixed(2)}` : "Not Available"}</Text>

        </>
      ) : (
        <Text>No data available for given date</Text>
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
});
