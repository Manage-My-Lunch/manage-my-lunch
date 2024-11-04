import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import CustomButton from "@/components/customButton";
import withRoleProtection from "../../../components/withRoleProtection";
import alert from "@/components/alert";
import CustomTextInput from "@/components/customTextInput";
import CustomPicker from "@/components/customPicker";

function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Error fetching user", userError?.message || "User not found.");
        return;
      }

      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        alert("Error loading profile", error.message);
      } else {
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setSelectedUniversity(data.university);
        setSelectedCampus(data.preferred_campus || null); // Reset campus if it is not set
      }

      const { data: uniData, error: uniError } = await supabase
        .from("university")
        .select("id, name");

      if (uniError) {
        alert("Error loading universities", uniError.message);
      } else {
        setUniversities(uniData);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedUniversity) {
      setSelectedCampus(null); // Reset campus when university changes
      return;
    }

    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from("campus")
        .select("id, name")
        .eq("university", selectedUniversity);

      if (error) {
        alert("Error loading campuses", error.message);
      } else {
        setCampuses(data);
      }
    };

    fetchCampuses();
  }, [selectedUniversity]);

  const handleSaveProfile = async () => {
    // Check if a campus is selected
    if (!selectedCampus) {
      alert("Cannot save profile", "Please select a campus before saving your profile.");
      return; // Exit the function early if no campus is selected
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("User not found!", "We could not update your profile.");
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
      alert("Profile Not Updated", "Your profile information was unable to be saved.");
    } else {
      alert("Profile Updated", "Your profile information has been saved successfully.");
      router.push("/student/profile");
    }
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#00BFA6" />;
  }

  return (
    <View style={styles.container}>
      {/* First Name Input field */}
      <CustomTextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      {/* Last Name Input field */}
      <CustomTextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text>Select University</Text>
      <CustomPicker
        selectedValue={selectedUniversity}
        onValueChange={(value) => {
          setSelectedUniversity(value);
          setSelectedCampus(null); // Reset campus selection on university change
        }}
        options={universities}
        placeholder="Choose a university"
      />

      <Text>Select Campus</Text>
      <CustomPicker
        selectedValue={selectedCampus}
        onValueChange={setSelectedCampus}
        options={campuses}
        placeholder="Choose a campus"
      />

      <CustomButton title="Save Changes" onPress={handleSaveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    paddingTop: 50,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  input: {
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderRadius: 5,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(EditProfileScreen, ["student"]);
