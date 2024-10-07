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
import { UserData, Indices } from "./types";
import { z } from "zod";
import { router } from "expo-router";

export default function Names({
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

  const handleNext = async () => {
    setError("");

    const parse = await formSchema.safeParseAsync({
      firstName: data.firstName,
      lastName: data.lastName,
    });

    if (!parse.success) {
      setError(parse.error.errors[0].message);
      return;
    }

    setIndex(Indices.CREDENTIALS);
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
        onChange={(e) => {
          setData({
            ...data,
            firstName: e.nativeEvent.text,
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
        placeholder="Last Name"
        placeholderTextColor="#555"
        textAlign="left"
        inputMode="text"
        autoComplete="name-family"
        spellCheck={false}
        textContentType="familyName"
        enterKeyHint="next"
        enablesReturnKeyAutomatically
        onChange={(e) => {
          setData({
            ...data,
            lastName: e.nativeEvent.text,
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
        onPress={handleNext}
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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
