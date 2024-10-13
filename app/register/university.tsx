import { useState } from "react";
import {
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { useFormContext } from "./_layout";
import { Picker } from "@react-native-picker/picker";

export default function Credentials() {
  const { data, universities } = useFormContext();
  const [error, setError] = useState("");
  const [university, setUniversity] = useState(0);
  const [campus, setCampus] = useState(0);

  const handleNext = async () => {
    setError("");

    if (universities === undefined || universities === null) {
      setError("Could not load university. Please try again later.");
      return;
    }

    if (
      university < 0 ||
      university >= universities.length ||
      universities[university] === undefined ||
      universities[university] === null
    ) {
      setError("Selected university does not exist.");
      return;
    }

    if (
      universities[university].campus.length === 0 ||
      universities[university].campus[campus] === undefined ||
      universities[university].campus[campus] === null
    ) {
      setError(
        "Campus could not be found. A campus is needed to create an account. If a campus is missing please contact support."
      );
      return;
    }

    data.updateFormData({
      university: universities[university],
      campus: universities[university].campus[campus],
    });

    router.push("/register/submit");
  };

  if (universities === null) {
    return (
      <View style={styles.view}>
        <Text>
          Failed to load universities from database. Please try again later.
        </Text>
        <Link
          href={"/"}
          style={{
            marginTop: 20,
            color: "#037ffc",
            textAlign: "center",
          }}
        >
          Home
        </Link>
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
          Finally, please specify which univeristy and campus you are will be
          ordering from.
        </Text>
        <Text style={{ color: "red" }}>{error}</Text>
        <Picker
          selectedValue={university}
          onValueChange={(v, i) => {
            setUniversity(i);
            setCampus(0);
          }}
          style={styles.picker}
        >
          {universities?.map((u, i) => {
            return (
              <Picker.Item label={u.name} value={i} key={u.id}></Picker.Item>
            );
          })}
        </Picker>
        <Picker
          selectedValue={campus}
          onValueChange={(v, i) => {
            setCampus(i);
          }}
          style={styles.picker}
        >
          {universities[university].campus.map((c, i) => {
            return (
              <Picker.Item
                label={`${c.name}, ${c.address_suburb}`}
                value={i}
                key={c.id}
              ></Picker.Item>
            );
          })}
        </Picker>
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
          href={"/register/credentials"}
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
    width: "100%",
  },
});
