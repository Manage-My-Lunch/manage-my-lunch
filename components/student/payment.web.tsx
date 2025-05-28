import Heading from "@/components/heading";
import { useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Text,
    StyleSheet,
    View,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import alert from "@/components/alert";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    useStripe,
    useElements,
    PaymentElement,
} from "@stripe/react-stripe-js";

function PaymentForm({
    clientSecret,
    paymentIntent,
    onSuccess,
}: {
    clientSecret: string;
    paymentIntent: string;
    onSuccess: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {},
            redirect: "if_required",
        });
        setSubmitting(false);
        if (error) {
            alert("Payment failed", error.message || "Unknown error");
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: 16 }}>
            <PaymentElement />
            <button
                type="submit"
                disabled={!stripe || submitting}
                style={{
                    marginTop: 16,
                    padding: 12,
                    background: "black",
                    color: "white",
                    borderRadius: 8,
                    fontSize: 18,
                    width: "100%",
                }}
            >
                {submitting ? "Processing..." : "Pay"}
            </button>
        </form>
    );
}

export default function PaymentWeb() {
    const [loading, setLoading] = useState(false);
    const [pickupLocations, setPickupLocations] = useState<
        { id: string; name: string }[]
    >([]);
    const [pickupLocation, setPickupLocation] = useState(0);
    const [pickupWindows, setPickupWindows] = useState<
        { id: string; open: Date; close: Date; available_slots: number }[]
    >([]);
    const [pickupWindow, setPickupWindow] = useState(0);
    const { completeOrder, finalTotal } = useCart();
    const [publishableKey, setPublishableKey] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntent, setPaymentIntent] = useState("");
    const [stripePromise, setStripePromise] = useState<any>(null);

    const fetchWindows = async (id: string) => {
        setLoading(true);
        let now = new Date();
        if (now.getHours() > 9) {
            now.setDate(now.getDate() + 1);
        }
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
            alert(
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
            alert("Something went wrong. Could not retrieve user ID.", "");
            setLoading(false);
            return;
        }
        const { data: campus, error: campusError } = await supabase
            .from("user")
            .select("preferred_campus")
            .eq("id", user.data.user.id)
            .single<{ preferred_campus: string }>();
        if (campusError !== null) {
            alert(
                "Something went wrong fetching user details. ",
                campusError.message
            );
            setLoading(false);
            return;
        }
        if (campus === null) {
            alert("Something went wrong. Could not retrieve user data.", "");
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
            alert(
                "Something went wrong fetching pickup locations. ",
                `${collectionPointError}`
            );
            setLoading(false);
            return;
        }
        setPickupLocations(collectionPoints);
        await fetchWindows(collectionPoints[0].id);
        setLoading(false);
    };

    const fetchPaymentSheetParams = async () => {
        const { data, error } = await supabase.functions.invoke<{
            clientSecret: string;
            publishableKey: string;
            paymentIntent: string;
        }>("stripe-payment-intent", {
            body: {
                amount: Math.round(finalTotal * 100),
                currency: "nzd",
            },
        });
        if (
            data &&
            data.publishableKey &&
            data.clientSecret &&
            data.paymentIntent
        ) {
            setPublishableKey(data.publishableKey);
            setClientSecret(data.clientSecret);
            setPaymentIntent(data.paymentIntent);
            setStripePromise(loadStripe(data.publishableKey));
        } else {
            alert(
                "Error fetching payment params",
                error ? error.message : "Unknown error"
            );
        }
    };

    useEffect(() => {
        fetchLocations();
        fetchPaymentSheetParams();
    }, []);

    const handleSuccess = async () => {
        await completeOrder(pickupWindows[pickupWindow].id, paymentIntent);
        router.push("/student/menu/order-confirmation");
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
            {!clientSecret || !stripePromise ? (
                <ActivityIndicator />
            ) : (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                    }}
                >
                    <PaymentForm
                        clientSecret={clientSecret}
                        paymentIntent={paymentIntent}
                        onSuccess={handleSuccess}
                    />
                </Elements>
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
});
