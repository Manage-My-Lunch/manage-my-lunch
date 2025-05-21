import { useEffect, useState } from "react";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { supabase } from "@/lib/supabase";
import { Alert, Button, View, ActivityIndicator } from "react-native";

export default function Checkout() {
    const [publishableKey, setPublishableKey] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(true);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const fetchPaymentSheetParams = async () => {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke<{
            clientSecret: string;
            publishableKey: string;
        }>("stripe-payment-intent", {
            body: {
                amount: 2000,
                currency: "nzd",
            },
        });
        if (data && data.publishableKey && data.clientSecret) {
            setPublishableKey(data.publishableKey);
            setClientSecret(data.clientSecret);
        } else {
            Alert.alert("Error fetching payment params", error ? error.message : "Unknown error");
        }
        setLoading(false);
    };

    const initializePaymentSheet = async () => {
        if (!publishableKey || !clientSecret) return;
        const { error } = await initPaymentSheet({
            paymentIntentClientSecret: clientSecret,
            merchantDisplayName: "Manage My Lunch",
        });
        if (error) {
            Alert.alert("Error initializing payment sheet", error.message);
        }
    };

    useEffect(() => {
        fetchPaymentSheetParams();
    }, []);

    useEffect(() => {
        if (publishableKey && clientSecret) {
            initializePaymentSheet();
        }
    }, [publishableKey, clientSecret]);

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();
        if (error) {
            Alert.alert("Payment failed", error.message);
        } else {
            Alert.alert("Success", "Your payment is confirmed!");
        }
    };

    if (!publishableKey) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
    }

    return (
        <StripeProvider publishableKey={publishableKey}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                {loading ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <Button title="Pay Now" onPress={openPaymentSheet} />
                )}
            </View>
        </StripeProvider>
    );
}
