import { useRef, useState } from "react";
import {
  Text,
  KeyboardAvoidingView,
  TextInput,
  Keyboard,
  Pressable,
  StyleSheet,
} from "react-native";
import { z } from "zod";
import { Link, router } from "expo-router";
import { useFormContext } from "./_layout";

export default function Credentials() {
  const { data } = useFormContext();
  const [error, setError] = useState("");

  const handleNext = async () => {
    setError("");

    const parse = await formSchema.safeParseAsync({
      email: data.formData.email,
      password: data.formData.password,
      cpassword: data.formData.cpassword,
    });

    if (!parse.success) {
      setError(parse.error.errors[0].message);
      return;
    }

    if (data.formData.password !== data.formData.cpassword) {
      setError("Passwords do not match");
      return;
    }

    router.push("/register/university");
  };

  const passwordField = useRef<TextInput>(null);
  const cPasswordField = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      style={styles.view}
      behavior="padding"
      onPointerDown={Keyboard.dismiss}
    >
      <Text style={styles.heading}>Register</Text>
      <Text style={{ width: "100%", textAlign: "center" }}>
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
        blurOnSubmit={false}
        onSubmitEditing={() => passwordField.current?.focus()}
        onChange={(e) => {
          data.updateFormData({
            ...data.formData,
            email: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width: "100%",
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <TextInput
        ref={passwordField}
        placeholder="Password"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoCapitalize="none"
        spellCheck={false}
        textContentType="password"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        secureTextEntry
        blurOnSubmit={false}
        onSubmitEditing={() => cPasswordField.current?.focus()}
        onChange={(e) => {
          data.updateFormData({
            ...data.formData,
            password: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width: "100%",
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <TextInput
        ref={cPasswordField}
        placeholder="Confirm Password"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoCapitalize="none"
        spellCheck={false}
        textContentType="password"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        secureTextEntry
        blurOnSubmit={false}
        onSubmitEditing={handleNext}
        onChange={(e) => {
          data.updateFormData({
            ...data.formData,
            cpassword: e.nativeEvent.text,
          });
        }}
        style={{
          borderWidth: 1,
          borderRadius: 4,
          width: "100%",
          marginTop: 20,
          padding: 10,
        }}
      ></TextInput>
      <Pressable
        onPress={handleNext}
        style={{
          marginTop: 20,
          backgroundColor: "#037ffc",
          padding: 15,
          width: "100%",
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Next</Text>
      </Pressable>
      <Link
        href={"/register"}
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
