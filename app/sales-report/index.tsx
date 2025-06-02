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
  const [today, setToday] = useState(() => new Date().toISOString().split("T")[0]);

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
    fetchSalesReport(today);
  }, [today]);

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Pressable style={styles.button} onPress={() => router.push("/")}>
          <Text style={styles.buttonText}>Home</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => router.push("/platform-manager")}>
          <Text style={styles.buttonText}>Platform Manager</Text>
        </Pressable>
      </View>


      <Text style={styles.heading}>Sales Report</Text>

      <input
        type="date"
        value={today}
        onChange={(e) => setToday(e.target.value)}
        style={styles.dateInput as any}
      />

      <View style={styles.reportContainer}>
        <Text style={styles.dateLabel}>Date: {today}</Text>
        {salesReport ? (
          <>
            <Text style={styles.metric}>Total Orders: {salesReport.total_orders}</Text>
            <Text style={styles.metric}>
              Total Cost:{" "}
              {salesReport.total_cost !== null
                ? `$${salesReport.total_cost.toFixed(2)}`
                : "Not Available"}
            </Text>
          </>
        ) : (
          <Text style={styles.noData}>No data available for this date.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
    backgroundColor: "#f9f9f9",
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
  heading: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  dateInput: {
    padding: 8,
    fontSize: 16,
    marginVertical: 10,
    borderRadius: 6,
    borderColor: "#ccc",
    borderWidth: 1,
    minWidth: 180,
  },
  reportContainer: {
    marginTop: 15,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    maxWidth: 360,
    width: "100%",
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  metric: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  noData: {
    fontSize: 15,
    color: "#666",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

});
