import { Text, View, TextInput, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import CustomButton from "@/components/customButton";

function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error fetching user", userError?.message || "User not found.");
        return;
      }

      setEmail(user.email);

      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        Alert.alert("Error loading profile", error.message);
      } else {
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setSelectedUniversity(data.university);
        setSelectedCampus(data.preferred_campus);
      }

      const { data: uniData, error: uniError } = await supabase
        .from("university")
        .select("id, name");

      if (uniError) {
        Alert.alert("Error loading universities", uniError.message);
      } else {
        setUniversities(uniData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedUniversity) return;

    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from("campus")
        .select("id, name")
        .eq("university", selectedUniversity);

      if (error) {
        Alert.alert("Error loading campuses", error.message);
      } else {
        setCampuses(data);
      }
    };

    fetchCampuses();
  }, [selectedUniversity]);

  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Error updating profile", "User is not logged in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("user")
      .update({
        first_name: firstName,
        last_name: lastName,
        university: selectedUniversity,
        preferred_campus: selectedCampus,
      })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error updating profile", error.message);
    } else {
      Alert.alert("Profile Updated", "Your profile information has been saved.");
      router.push("/student/profile"); // Navigate back to profile screen
    }
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#00BFA6" />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        editable={false}
      />

      <Text>Select University</Text>
      <Picker
        selectedValue={selectedUniversity}
        onValueChange={(value) => setSelectedUniversity(value)}
        style={styles.picker}
      >
        {universities.map((uni) => (
          <Picker.Item key={uni.id} label={uni.name} value={uni.id} />
        ))}
      </Picker>

      <Text>Select Campus</Text>
      <Picker
        selectedValue={selectedCampus}
        onValueChange={(value) => setSelectedCampus(value)}
        style={styles.picker}
      >
        {campuses.map((campus) => (
          <Picker.Item key={campus.id} label={campus.name} value={campus.id} />
        ))}
      </Picker>

      <CustomButton title="Save Changes" onPress={handleSaveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 5,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    marginTop: 20,
    padding: 10,
  },
});

export default EditProfileScreen;
