import { Dispatch, SetStateAction, useState } from "react";
import { UniversityList, UserData } from "./types";
import { DimensionValue, StyleSheet, View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function University({
  data,
  setData,
  setIndex,
  width,
  universityList,
}: {
  data: UserData;
  setData: Dispatch<SetStateAction<UserData>>;
  setIndex: Dispatch<SetStateAction<number>>;
  width: DimensionValue;
  universityList: UniversityList;
}) {
  const [error, setError] = useState("");
  const [univeristy, setUniversity] = useState(0);

  return (
    <View style={styles.view}>
      <Text style={styles.heading}>Register</Text>
      <Text style={{ width, textAlign: "center" }}>
        Finally, please specify which univeristy and campus you are will be
        ordering from.
      </Text>
      <Text style={{ color: "red" }}>{error}</Text>
      <Picker
        selectedValue={univeristy}
        onValueChange={(v, i) => {
          setUniversity(i);
        }}
        style={{ ...styles.picker, width }}
      >
        {universityList.map((u, i) => {
          return (
            <Picker.Item label={u.name} value={i} key={u.id}></Picker.Item>
          );
        })}
      </Picker>
    </View>
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
  picker: {
    backgroundColor: "white",
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
  },
});
