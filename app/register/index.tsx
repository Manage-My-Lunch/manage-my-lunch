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

export default function Index() {
  // Form context
  const { data } = useFormContext();
  // Error state
  const [error, setError] = useState("");

  // Handle when the user has pressed the next button/submitted this part of the form
  const handleNext = async () => {
    setError("");

    // Use Zod to verify the data the user has given us
    const parse = await formSchema.safeParseAsync({
      firstName: data.formData.firstName,
      lastName: data.formData.lastName,
    });

    // Show the Zod error
    if (!parse.success) {
      setError(parse.error.errors[0].message);
      return;
    }

    // Go to the next part of the process
    router.push("/register/credentials");
  };

  // A reference to the fields in the form to allow us to navigate between them using the keyboard
  const lastField = useRef<TextInput>(null);

  return (
    <KeyboardAvoidingView
      style={styles.view}
      behavior="padding"
      onPointerDown={Keyboard.dismiss}
    >
      <Text style={styles.heading}>Register</Text>
      <Text>To begin, please provide your names.</Text>
      <Text style={{ color: "red" }}>{error}</Text>
      <TextInput
        placeholder="First Name"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoComplete="name-given"
        spellCheck={false}
        textContentType="givenName"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        blurOnSubmit={false}
        onSubmitEditing={() => lastField.current?.focus()}
        onChange={(e) => {
          data.updateFormData({
            ...data.formData,
            firstName: e.nativeEvent.text,
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
        ref={lastField}
        placeholder="Last Name"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoComplete="name-family"
        spellCheck={false}
        textContentType="familyName"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        blurOnSubmit={false}
        onSubmitEditing={handleNext}
        onChange={(e) => {
          data.updateFormData({
            ...data.formData,
            lastName: e.nativeEvent.text,
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
        href={"/"}
        style={{
          marginTop: 20,
          width: "100%",
          textAlign: "center",
          color: "red",
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
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 32,
    fontWeight: "medium",
  },
});

// Zod Schema to validate the form
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
