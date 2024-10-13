import { useEffect, useState } from "react";
import {
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useFormContext } from "./_layout";
import { supabase } from "@/lib/supabase";

export default function Credentials() {
  const { data } = useFormContext();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if (data.formData.firstName === "" || data.formData.lastName === "") {
    //   router.push("/register/");
    // } else if (
    //   data.formData.email === "" ||
    //   data.formData.password === "" ||
    //   data.formData.cpassword === ""
    // ) {
    //   router.push("/register/credentials");
    // } else if (
    //   data.formData.university === null ||
    //   data.formData.campus === null
    // ) {
    //   router.push("/register/university");
    // }
  }, []);

  const handleNext = async () => {
    setError("");
    setLoading(true);

    // Double check that the
    if (data.formData.firstName === "" || data.formData.lastName === "") {
      setError(
        "One or more names are missing. Please complete the beginning of the form."
      );
      setLoading(false);
      return;
    } else if (
      data.formData.email === "" ||
      data.formData.password === "" ||
      data.formData.cpassword === ""
    ) {
      setError(
        "Email or password is not set. Please complete email & password form."
      );
      setLoading(false);
      return;
    } else if (
      data.formData.university === null ||
      data.formData.campus === null
    ) {
      setError(
        "University or campus is missing. Please go back and choose your university or campus."
      );
      setLoading(false);
      return;
    }

    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: data.formData.email,
      password: data.formData.password,
      options: {
        // TODO: Replace this with a URL given by the device
        emailRedirectTo: "http://localhost:8081/register/verified",
      },
    });

    if (authError !== null) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authUser.user === null) {
      setError(
        "New user could not be created. Empty user returned. Please try again later."
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("user").insert({
      id: authUser.user.id,
      first_name: data.formData.firstName,
      last_name: data.formData.lastName,
      university: data.formData.university.id,
      preferred_campus: data.formData.campus.id,
      role: "student",
    });

    if (error !== null) {
      setError(
        "This email may already be used. Please use a different email for your account."
      );
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.view}
      behavior="padding"
      onPointerDown={Keyboard.dismiss}
    >
      <Text style={styles.heading}>Register</Text>
      <Text style={{ width: "100%", textAlign: "center" }}>
        Please check that all the details below are correct.
      </Text>
      <Text style={{ color: "red" }}>{error}</Text>
      <ListItem
        title="Name:"
        value={`${data.formData.firstName} ${data.formData.lastName}`}
      ></ListItem>
      <ListItem title="Email:" value={data.formData.email}></ListItem>
      <ListItem
        title="University:"
        value={data.formData.university?.name ?? ""}
      ></ListItem>
      <ListItem
        title="Campus:"
        value={data.formData.campus?.name ?? ""}
      ></ListItem>
      <Pressable
        onPress={handleNext}
        disabled={loading}
        style={{
          marginTop: 20,
          backgroundColor: loading ? "#444" : "#037ffc",
          padding: 15,
          width: "100%",
          borderRadius: 6,
        }}
      >
        {loading ? (
          <ActivityIndicator color="white"></ActivityIndicator>
        ) : (
          <Text style={{ color: "white", textAlign: "center" }}>Submit</Text>
        )}
      </Pressable>
      <Link
        href={"/register/university"}
        style={{
          marginTop: 20,
          color: "#037ffc",
          textAlign: "center",
        }}
      >
        Back
      </Link>
      <Link
        href={"/"}
        style={{
          marginTop: 20,
          color: "red",
          textAlign: "center",
        }}
      >
        Cancel
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  view: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    maxWidth: "100%",
  },
  heading: {
    fontSize: 32,
    fontWeight: "medium",
  },
  picker: {
    backgroundColor: "white",
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
});

const ListItem = ({ title, value }: { title: string; value: string }) => {
  return (
    <View
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        flexDirection: "row",
      }}
    >
      <Text style={{ textAlign: "left", fontWeight: "600", width: "30%" }}>
        {title}
      </Text>
      <Text style={{ textAlign: "right", width: "70%" }}>{value}</Text>
    </View>
  );
};
