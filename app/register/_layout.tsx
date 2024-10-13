import { UserData } from "@/components/register/types";
import { Slot } from "expo-router";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Dimensions, DimensionValue, ScaledSize } from "react-native";

const FormContext = createContext<
  | {
      data: {
        formData: UserData;
        updateFormData: (data: Partial<UserData>) => void;
      };
      style: { width: DimensionValue };
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
    university: 0,
    campus: 0,
  });

  const updateFormData = (data: Partial<UserData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const [width, setWidth] = useState<DimensionValue>("50%" as DimensionValue);

  useEffect(() => {
    // Set the dimensions on load
    setDimensions(Dimensions.get("window"));
    // Listen for changes to the window's dimensions and update the width values
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Sets the width of certain elements given the window's dimensions
  const setDimensions = (window: ScaledSize) => {
    if (window.width >= 1024) {
      setWidth("25%");
    } else if (window.width >= 728) {
      setWidth("50%");
    } else {
      setWidth("75%");
    }
  };

  return (
    <FormContext.Provider
      value={{ data: { formData, updateFormData }, style: { width } }}
    >
      {children}
    </FormContext.Provider>
  );
};

export default function Layout() {
  return (
    <FormProvider>
      <Slot></Slot>
    </FormProvider>
  );
}
