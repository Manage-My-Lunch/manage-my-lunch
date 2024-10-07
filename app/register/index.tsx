import { Indices, UniversityList, UserData } from "@/components/register/types";
import Names from "@/components/register/Names";
import { useEffect, useState } from "react";
import { Dimensions, DimensionValue, ScaledSize } from "react-native";
import Credentials from "@/components/register/Credentials";
import { supabase } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import University from "@/components/register/University";

export default function Index() {
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<UserData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    cpassword: "",
  });
  const [univeristyList, setUniversityList] = useState<UniversityList>([]);
  const [width, setWidth] = useState("50%" as DimensionValue);

  const fecthData = async () => {
    const {
      data,
      error,
    }: { data: UniversityList | null; error: PostgrestError | null } =
      await supabase
        .from("university")
        .select("id, name, abbreviation, campus(id, name)");
    // TODO: Improve the error handling for this
    if (error !== null) {
      console.log(error);
      return;
    }
    if (data === null) {
      console.log("Missing university data");
      return;
    }
    setUniversityList(data);
    console.log("Thing");
  };

  useEffect(() => {
    fecthData();
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

  switch (index) {
    case Indices.NAMES:
      return (
        <Names
          width={width}
          data={data}
          setData={setData}
          setIndex={setIndex}
        ></Names>
      );
    case Indices.CREDENTIALS:
      return (
        <Credentials
          width={width}
          data={data}
          setData={setData}
          setIndex={setIndex}
        ></Credentials>
      );
    case Indices.UNIVERSITY:
      return (
        <University
          width={width}
          data={data}
          setData={setData}
          setIndex={setIndex}
          universityList={univeristyList}
        ></University>
      );
  }
}
