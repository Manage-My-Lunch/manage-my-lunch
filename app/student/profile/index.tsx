import { Text, View, Pressable, StyleSheet, Alert, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import withRoleProtection from "../../../components/withRoleProtection";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';
import CustomButton from "@/components/customButton";

function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);

  // Fetch user and profile data on mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error fetching user", userError?.message || "User not found.");
        return;
      }

      setEmail(user.email);

      const { data, error: profileError } = await supabase
        .from("user")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        Alert.alert("Error loading profile", profileError.message);
      } else {
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setSelectedUniversity(data.university);
        setSelectedCampus(data.preferred_campus);
      }

      // Fetch universities
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

  // Fetch campuses
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

  // Handle navigation
  const handleRewards = () => router.push("/student/profile/rewards");
  const handleOrderHistory = () => router.push("/student/profile/orderHistory");
  const handleEdit = () => router.push("/student/profile/editProfile");
  const handleNewPassword = () => router.push("/student/profile/changePassword");

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
        <Text style={styles.fullName}>{`${firstName} ${lastName}`}</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoContent}>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.university}>{selectedUniversity ? getUniversityName(selectedUniversity) : "Unknown University"}</Text>
            <Text style={styles.campus}>{selectedCampus ? getCampusName(selectedCampus) : "Unknown Campus"}</Text>
            <CustomButton
              title="Set New Password"
              onPress={handleNewPassword}
              style={styles.changePasswordButton}
              textStyle={styles.changePasswordText}
            />
          </View>

          <Pressable style={styles.editButton} onPress={handleEdit}>
            <FontAwesome name="pencil" size={20} color="white" />
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
          />
          <CustomButton
            title="Order History"
            onPress={handleOrderHistory}
          />
          <CustomButton
            title="Rewards"
            onPress={handleRewards}
          />
        </View>
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    backgroundColor: "white",
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    width: "100%",
  },
  infoContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    position: "relative",
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  changePasswordButton: {
    marginTop: 10,
    backgroundColor: "#fff",
    alignItems: 'flex-start',
  },
  changePasswordText: {
    fontSize: 16,
    color: "#00BFA6",
  },
  editButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: "#00BFA6",
    borderRadius: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});

// Protect the component with role-based access for students
export default withRoleProtection(ProfileScreen, ["student"]);
