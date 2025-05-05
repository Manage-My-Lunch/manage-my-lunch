import Heading from "@/components/heading";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Text,
    StyleSheet,
    Alert,
    View,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";

export default function Checkout() {
    const [loading, setLoading] = useState(false);
    const [pickupLocations, setPickupLocations] = useState<
        { id: string; name: string }[]
    >([]);
    const [pickupLocation, setPickupLocation] = useState(0);

    const [pickupWindows, setPickupWindows] = useState<
        { id: string; open: Date; close: Date; available_slots: number }[]
    >([]);
    const [pickupWindow, setPickupWindow] = useState(0);

    const { completeOrder } = useCart();

    const fetchWindows = async (id: string) => {
        setLoading(true);

        const now = new Date();

        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const { data: windows, error } = await supabase
            .from("pickup_window")
            .select()
            .eq("collection_point", id)
            .gte("open", now.toISOString())
            .lte("close", tomorrow.toISOString())
            .gt("available_slots", 0)
            .order("open", { ascending: true })
            .overrideTypes<
                Array<{
                    id: string;
                    open: string;
                    close: string;
                    available_slots: number;
                }>
            >();

        if (error !== null) {
            Alert.alert(
                "Something went wrong fetching pickup windows.",
                error.message
            );
            setLoading(false);
            return;
        }

        setPickupWindows(
            windows.map((w) => {
                return {
                    ...w,
                    open: new Date(w.open),
                    close: new Date(w.close),
                };
            })
        );

        setLoading(false);
    };

    const fetchLocations = async () => {
        setLoading(true);

        const user = await supabase.auth.getUser();

        if (user.data.user === null) {
            Alert.alert("Something went wrong. Could not retrieve user ID.");
            setLoading(false);
            return;
        }

        const { data: campus, error: campusError } = await supabase
            .from("user")
            .select("preferred_campus")
            .eq("id", user.data.user.id)
            .single<{ preferred_campus: string }>();

        if (campusError !== null) {
            Alert.alert(
                "Something went wrong fetching user details. " +
                    campusError.message
            );
            setLoading(false);
            return;
        }

        if (campus === null) {
            Alert.alert("Something went wrong. Could not retrieve user data.");
            setLoading(false);
            return;
        }

        const { data: collectionPoints, error: collectionPointError } =
            await supabase
                .from("collection_point")
                .select()
                .eq("campus", campus.preferred_campus)
                .overrideTypes<Array<{ id: string; name: string }>>();

        if (collectionPointError !== null) {
            Alert.alert(
                "Something went wrong fetching pickup locations. " +
                    collectionPointError
            );
            setLoading(false);
            return;
        }

        setPickupLocations(collectionPoints);
        await fetchWindows(collectionPoints[0].id);

        setLoading(false);
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const handlePay = async () => {
        setLoading(false);
        await completeOrder(pickupWindows[pickupWindow].id);
    };

    return (
        <View style={styles.body}>
            <Heading size={3}>Pickup Location:</Heading>
            <Picker
                itemStyle={{ minWidth: "100%" }}
                selectedValue={pickupLocation}
                onValueChange={(v, i) => {
                    setPickupLocation(i);
                    fetchWindows(pickupLocations[i].id);
                }}
                style={styles.picker}
            >
                {pickupLocations.map((c, i) => {
                    return (
                        <Picker.Item
                            color="black"
                            label={`${c.name}`}
                            value={i}
                            key={c.id}
                        ></Picker.Item>
                    );
                })}
            </Picker>
            <Heading size={3} style={{ marginTop: 16 }}>
                Pickup Windows:
            </Heading>
            <Picker
                itemStyle={{ minWidth: "100%" }}
                selectedValue={pickupWindow}
                onValueChange={(v, i) => {
                    setPickupWindow(i);
                }}
                style={styles.picker}
            >
                {pickupWindows.map((c, i) => {
                    return (
                        <Picker.Item
                            color="black"
                            label={`${c.open.toLocaleString("en-NZ", {})}`}
                            value={i}
                            key={c.id}
                        ></Picker.Item>
                    );
                })}
            </Picker>

            {!loading ? (
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handlePay}
                >
                    <Text style={styles.continueButtonText}>Pay</Text>
                </TouchableOpacity>
            ) : (
                <ActivityIndicator></ActivityIndicator>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    body: {
        padding: 16,
    },
    picker: {
        backgroundColor: "white",
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 4,
        width: "100%",
        color: "black",
    },
    continueButton: {
        marginTop: 8,
        backgroundColor: "black",
        borderRadius: 8,
        padding: 8,
    },
    continueButtonText: {
        color: "white",
        fontSize: 24,
        fontWeight: 700,
        textAlign: "center",
    },
});
