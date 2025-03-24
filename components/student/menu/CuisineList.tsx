import { supabase } from "@/lib/supabase";
import theme from "@/lib/theme";
import { Category } from "@/lib/types";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Button,
  Pressable,
  FlatList,
} from "react-native";

interface Props {
  filter: string | null;
  handleFilter: (id: string | null) => void;
}

const CuisineList: React.FC<Props> = ({ filter, handleFilter }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("category").select();

    if (error) {
      console.error(error);
      return;
    }

    setCategories(data);
  };

  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <ActivityIndicator
          size="small"
          color="white"
          style={{ margin: "auto", paddingVertical: 8 }}
        ></ActivityIndicator>
      ) : (
        <FlatList
          data={categories}
          renderItem={({ item }) => {
            if (filter === null || item.id === filter) {
              return (
                <Pressable
                  style={styles.listItem}
                  onPress={() => handleFilter(item.id)}
                >
                  <Text>{item.name}</Text>
                </Pressable>
              );
            }
            return (
              <Pressable
                style={styles.listItemInactive}
                onPress={() => handleFilter(item.id)}
              >
                <Text style={{ color: "white" }}>{item.name}</Text>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item.id}
          horizontal={true}
        ></FlatList>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colours.primary,
    width: "100%",
    paddingVertical: 6,
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 4,
  },
  listItemInactive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 4,
  },
});

export default CuisineList;
