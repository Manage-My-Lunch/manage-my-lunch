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
import { Link } from "expo-router";
import { useFormContext } from "./_layout";
import { supabase } from "@/lib/supabase";

export default function Credentials() {
  // Form context
  const { data } = useFormContext();
  // Error state
  const [error, setError] = useState("");
  // Loading state while database works
  const [loading, setLoading] = useState(false);
  // State to devide when to switch to the confirmation screen
  const [complete, setComplete] = useState(false);

  // TODO: Implement this elsewhere
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

  // Handle when the user has pressed the next button/submitted this part of the form
  const handleNext = async () => {
    setError("");
    // Show we are working
    setLoading(true);

    // Double check that the form data is complete, otherwise the user has to go back
    // TODO: Handle this better
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

    // Sign the user up
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: data.formData.email,
      password: data.formData.password,
      options: {
        // TODO: Replace this with a URL given by the device
        emailRedirectTo: "http://localhost:8081/register/verified",
      },
    });

    // Sign up errors are presented to the user
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

    // Using the ID given from the sign up data, add the user to our user table
    const { error } = await supabase.from("user").insert({
      id: authUser.user.id,
      first_name: data.formData.firstName,
      last_name: data.formData.lastName,
      university: data.formData.university.id,
      preferred_campus: data.formData.campus.id,
      role: "student",
      points: 0,         
      voucher_count: 0   
    });

    // Assume that the email may already exist since Supabase errors aren't clear
    if (error !== null) {
      setError(
        "This email may already be used. Please use a different email for your account."
      );
      setLoading(false);
      return;
    }

    // Show the confirmation screen
    setComplete(true);
  };

  if (complete) {
    return (
      <View>
        <Text style={{ textAlign: "center" }}>
          To complete your registration, please follow the instructions on the
          confirmation email sent to {data.formData.email}.
        </Text>
        <Text style={{ textAlign: "center" }}>
          Feel free to close this page.
        </Text>
      </View>
    );
  } else {
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

// A component to list the items in the form in a way where I don't have to copy and paste for each element
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
