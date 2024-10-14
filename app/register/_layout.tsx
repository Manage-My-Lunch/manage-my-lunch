import { UniversityList, UserData } from "@/components/register/types";
import { supabase } from "@/lib/supabase";
import { Link, Slot } from "expo-router";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Dimensions,
  DimensionValue,
  KeyboardAvoidingView,
  ScaledSize,
  View,
  Text,
  ActivityIndicator,
} from "react-native";

/**
 * Maintains a shareable context of the form's data such as the user's input and university information from the database
 */
const FormContext = createContext<
  | {
      data: {
        formData: UserData;
        updateFormData: (data: Partial<UserData>) => void;
      };
      universities: UniversityList | null;
    }
  | undefined
>(undefined);

// Setup the form context
export const useFormContext = () => {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("Form context must be used in a form provider");
  }

  return context;
};

// Wrapper component to provide form context to all children
export const FormProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Initialise user data state
  const [formData, setFormData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    cpassword: "",
    university: null,
    campus: null,
  });

  // Helper method to modify user data
  const updateFormData = (data: Partial<UserData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Track screen width
  const [width, setWidth] = useState<DimensionValue>("50%" as DimensionValue);
  // Track data loading state
  const [loading, setLoading] = useState(true);
  // University data from database
  const [universities, setUniversities] = useState<UniversityList | null>(null);

  useEffect(() => {
    // Set the dimensions on load
    setDimensions(Dimensions.get("window"));
    // Listen for changes to the window's dimensions and update the width values
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    // Fetch university data
    fetchData();

    return () => subscription?.remove();
  }, []);

  // Sets the width of certain elements given the window's dimensions
  const setDimensions = (window: ScaledSize) => {
    if (window.width >= 1024) {
      setWidth("30%");
    } else if (window.width >= 728) {
      setWidth("50%");
    } else {
      setWidth("75%");
    }
  };

  // Fetch university data from database
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("university")
      .select("*, campus(*)");

    // The user will see an error message if data is null so we could just print to the console
    if (error !== null) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Set the data
    setUniversities(data);
    // We have loaded all data
    setLoading(false);
  };

  if (loading) {
    // Loading indicator
    return (
      <View
        style={{
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large"></ActivityIndicator>
      </View>
    );
  } else {
    // If universities is still null after we have finished loading, assume the data failed to load
    if (universities === null) {
      return (
        <View
          style={{
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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
      // Render the children
      return (
        <KeyboardAvoidingView
          style={{
            margin: "auto",
            width,
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FormContext.Provider
            value={{
              data: { formData, updateFormData },
              universities,
            }}
          >
            {children}
          </FormContext.Provider>
        </KeyboardAvoidingView>
      );
    }
  }
};

export default function Layout() {
  return (
    <FormProvider>
      <Slot></Slot>
    </FormProvider>
  );
}
