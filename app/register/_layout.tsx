import { UniversityList, UserData } from "@/components/register/types";
import { supabase } from "@/lib/supabase";
import { router, Slot } from "expo-router";
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
} from "react-native";

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

export const useFormContext = () => {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error("Form context must be used in a form provider");
  }

  return context;
};

export const FormProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    cpassword: "",
    university: null,
    campus: null,
  });

  const updateFormData = (data: Partial<UserData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const [width, setWidth] = useState<DimensionValue>("50%" as DimensionValue);
  const [universities, setUniversities] = useState<UniversityList | null>(null);

  useEffect(() => {
    // Set the dimensions on load
    setDimensions(Dimensions.get("window"));
    // Listen for changes to the window's dimensions and update the width values
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

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

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("university")
      .select("*, campus(*)");

    if (error !== null) {
      console.error(error);
      return;
    }

    setUniversities(data);
  };

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
};

export default function Layout() {
  return (
    <FormProvider>
      <Slot></Slot>
    </FormProvider>
  );
}
