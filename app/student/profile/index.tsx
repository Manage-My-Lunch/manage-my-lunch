import { Text, View, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import withRoleProtection from "../../../components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Track edit mode

  // Fetch user details and universities on component mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error fetching user", userError?.message || "User not found.");
        return;
      }

      // Set email from the Supabase auth user object
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

      // Fetch universities for dropdown
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

  // Fetch campuses when a university is selected
  useEffect(() => {
    if (!selectedUniversity) return;

    const fetchCampuses = async () => {
      const { data, error } = await supabase
        .from("campus")
        .select("id, name")
        .eq("university_id", selectedUniversity);

      if (error) {
        Alert.alert("Error loading campuses", error.message);
      } else {
        setCampuses(data);
      }
    };

    fetchCampuses();
  }, [selectedUniversity]);

  // Handle profile update
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
        preferred_campus: selectedCampus
      })
      .eq("id", user.id);

    if (error) {
      Alert.alert("Error updating profile", error.message);
    } else {
      Alert.alert("Profile Updated", "Your profile information has been saved.");
      setIsEditing(false); // Return to non-edit mode after saving
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout Error", error.message);
    } else {
      router.replace("/login");
      Alert.alert("Successfully logged out!");
    }
  };

  // Function to get the university name by ID
  const getUniversityName = (id: string) => {
    const university = universities.find((uni) => uni.id === id);
    return university ? university.name : "Unknown University";
  };

  // Function to get the campus name by ID
  const getCampusName = (id: string) => {
    const campus = campuses.find((camp) => camp.id === id);
    return campus ? campus.name : "Unknown Campus";
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" color="#00BFA6" />;
  }

  return (
    <View style={styles.container}>
      {isEditing ? (
        <>
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
          style={{ height: 50, backgroundColor: '#fff' }}
            selectedValue={selectedUniversity}
            onValueChange={(value) => setSelectedUniversity(value)}
          >
            {universities.map((uni) => (
              <Picker.Item key={uni.id} label={uni.name} value={uni.id} />
            ))}
          </Picker>

          <Text>Select Campus</Text>
          <Picker
            selectedValue={selectedCampus}
            onValueChange={(value) => setSelectedCampus(value)}
          >
            {campuses.map((campus) => (
              <Picker.Item key={campus.id} label={campus.name} value={campus.id} />
            ))}
          </Picker>

          <Pressable style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.fullName}>{`${firstName} ${lastName}`}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.university}>
            {selectedUniversity ? getUniversityName(selectedUniversity) : "Unknown University"}
          </Text>
          <Text style={styles.campus}>
            {selectedCampus ? getCampusName(selectedCampus) : "Unknown Campus"}
          </Text>

          <Pressable style={styles.button} onPress={() => setIsEditing(true)}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Set New Password</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Order History</Text>
          </Pressable>

          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Rewards</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  fullName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 4,
  },
  university: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  campus: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  button: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#00BFA6",
    borderRadius: 5,
  },
  saveButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#5faffd",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(ProfileScreen, ["student"]);
