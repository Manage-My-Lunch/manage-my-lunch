import { Dispatch, SetStateAction, useState } from "react";
import {
  Text,
  KeyboardAvoidingView,
  TextInput,
  Keyboard,
  Pressable,
  StyleSheet,
  DimensionValue,
} from "react-native";
import { z } from "zod";
import { Indices, UserData } from "./types";
import { router } from "expo-router";

export default function Credentials({
  data,
  setData,
  setIndex,
  width,
}: {
  data: UserData;
  setData: Dispatch<SetStateAction<UserData>>;
  setIndex: Dispatch<SetStateAction<number>>;
  width: DimensionValue;
}) {
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    const parse = await formSchema.safeParseAsync({
      email: data.email,
      password: data.password,
      cpassword: data.cpassword,
    });

    if (!parse.success) {
      setError(parse.error.errors[0].message);
      return;
    }

    if (data.password !== data.cpassword) {
      setError("Passwords do not match");
      return;
    }

    setIndex(Indices.UNIVERSITY);
  };

  const handleBack = () => {
    setIndex(0);
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <KeyboardAvoidingView
      style={styles.view}
      behavior="padding"
      onPointerDown={Keyboard.dismiss}
    >
      <Text style={styles.heading}>Register</Text>
      <Text style={{ width, textAlign: "center" }}>
        Next we need your email to contact you and a password to keep your
        account secure.
      </Text>
      <Text style={{ color: "red" }}>{error}</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        spellCheck={false}
        textContentType="emailAddress"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        onChange={(e) => {
          setData({
            ...data,
            email: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width,
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <TextInput
        placeholder="Password"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoCapitalize="none"
        spellCheck={false}
        textContentType="password"
        enterKeyHint="done"
        enablesReturnKeyAutomatically
        secureTextEntry
        onChange={(e) => {
          setData({
            ...data,
            password: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width,
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoCapitalize="none"
        spellCheck={false}
        textContentType="password"
        enterKeyHint="done"
        enablesReturnKeyAutomatically
        secureTextEntry
        onChange={(e) => {
          setData({
            ...data,
            cpassword: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width,
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <Pressable
        onPress={handleRegister}
        style={{
          marginTop: 20,
          backgroundColor: "#037ffc",
          padding: 15,
          width,
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Next</Text>
      </Pressable>
      <Pressable
        onPress={handleBack}
        style={{
          marginTop: 20,
          width,
        }}
      >
        <Text style={{ color: "#037ffc", textAlign: "center" }}>Back</Text>
      </Pressable>
      <Pressable
        onPress={handleCancel}
        style={{
          marginTop: 20,
          width,
        }}
      >
        <Text style={{ color: "red", textAlign: "center" }}>Cancel</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  view: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 32,
    fontWeight: "medium",
  },
});

const formSchema = z.object({
  email: z.string().email("Email is required").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  cpassword: z.string().min(1, "Confirm your password"),
});
