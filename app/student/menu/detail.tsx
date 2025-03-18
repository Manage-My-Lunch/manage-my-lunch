import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MenuItemType, Allergen } from "@/lib/types";
export default function MenuItemDetail() {
  const { id, restaurantId } = useLocalSearchParams();
  const [menuItem, setMenuItem] = useState<MenuItemType | null>(null);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state variable to track user's selected allergens
  const [userAllergies, setUserAllergies] = useState<Set<string>>(new Set());
  // state variable to store the quantity of the item they wish to add to cart
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchMenuItem();
  }, [id]);

  const fetchMenuItem = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data: itemData, error: itemError } = await supabase
        .from("item")
        .select("*")
        .eq("id", id)
        .single();

      if (itemError) throw itemError;

      // Modified to join with the 'allergen' table to get allergen names
      const { data: allergenData, error: allergenError } = await supabase
        .from("item_allergen")
        .select("id, allergen (id, name)")
        .eq("item", id);

      if (allergenError) throw allergenError;

      console.log("Fetched menu item:", itemData);
      console.log("Fetched allergens:", allergenData);

      setMenuItem(itemData as MenuItemType);
      // Map the data to a list of allergens
      const allergensList = allergenData.map((item: any) => ({
        id: item.allergen.id,
        name: item.allergen.name,
        created_at: item.allergen.created_at,
        allergen: item.allergen.id,
        item: id,
      }));
      setAllergens(allergensList as Allergen[]);
    } catch (error) {
      setError("Failed to fetch menu item");
      console.error("Error fetching menu item:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle allergen button press
  const handleAllergenPress = (allergenName: string) => {
    setUserAllergies((prevAllergies) => {
      const newAllergies = new Set(prevAllergies);
      if (newAllergies.has(allergenName)) {
        newAllergies.delete(allergenName);
      } else {
        newAllergies.add(allergenName);
      }
      return newAllergies;
    });
  };

  // Function to handle 'Add to Cart' button press
  const handleAddToCart = async () => {
    // Ensure menu item has loaded 
    if (!menuItem) {
      Alert.alert("Error", "Item details are not available.");
      return;
    }

    // Existing code to check for allergens
    try {
      const itemAllergenNames = allergens.map((a) => a.name);
      const conflictingAllergens = itemAllergenNames.filter((a) =>
      userAllergies.has(a)
      );
  
      const proceedWithAdding = async () => {
        // Get the logged-in user's ID
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("User not authenticated");
  
        const userId = userData.user.id;
  
        // Check for an existing unpaid order
        const { data: existingOrder, error: orderError } = await supabase
          .from("order")
          .select("*")
          .eq("user", userId)
          .is("paid_at", null)
          .single();
  
        if (orderError && orderError.code !== "PGRST116") throw orderError;
  
        let orderId;
  
        // If an unpaid order exists, check if it's expired (hasn't been updated in 24hours+)
        if (existingOrder) {
          // Convert updated_at to Date
          const updatedAt = existingOrder.updated_at ? new Date(existingOrder.updated_at) : null;
          const now = new Date();
      
          if (updatedAt && now.getTime() - updatedAt.getTime() > 24 * 60 * 60 * 1000) {
            // Delete associated order items first
            const { error: deleteOrderItemsError } = await supabase
            .from("order_item")
            .delete()
            .eq('"order"', existingOrder.id); 

            if (deleteOrderItemsError) throw deleteOrderItemsError;

            // If last update was more than 24 hours ago, delete the order
            const { error: deleteOrderError } = await supabase
              .from("order")
              .delete()
              .eq("id", existingOrder.id);
      
            if (deleteOrderError) throw deleteOrderError;
      
            // Create a new order
            const { data: newOrder, error: newOrderError } = await supabase
              .from("order")
              .insert([{ user: userId, total_cost: 0, total_items: 0 }])
              .select()
              .single();
      
            if (newOrderError) throw newOrderError;
      
            orderId = newOrder.id;
          } else {
            orderId = existingOrder.id;
          }
        } else {
          // If no existing order, create a new one
          const { data: newOrder, error: newOrderError } = await supabase
            .from("order")
            .insert([{ user: userId, total_cost: 0, total_items: 0 }])
            .select()
            .single();
  
          if (newOrderError) throw newOrderError;
  
          orderId = newOrder.id;
        }
  
        // Check if item selected is already in cart
        const { data: existingCartItem, error: cartItemError } = await supabase
          .from("order_item")
          .select("*")
          .eq('"order"', orderId) //need double quotations so doesn't get confused with sql ORDER (sorting)
          .eq("item", id)
          .single();
  
        if (cartItemError && cartItemError.code !== "PGRST116") throw cartItemError;
  
        if (existingCartItem) {
          // Update quantity and total price
          const newQuantity = existingCartItem.quantity + quantity;
          const newTotal = newQuantity * menuItem.price;
  
          const { error: updateError } = await supabase
            .from("order_item")
            .update({ quantity: newQuantity, line_total: newTotal })
            .eq("id", existingCartItem.id);
  
          if (updateError) throw updateError;
        } else {
          // Insert a new item
          const { error: insertError } = await supabase.from("order_item").insert([
            {
              order: orderId,
              item: id,
              quantity,
              line_total: menuItem.price * quantity,
            },
          ]);
  
          if (insertError) throw insertError;
        }
  
        // Update order totals
        const updatedTotalCost = (existingOrder?.total_cost || 0) + menuItem.price * quantity;
        const updatedTotalItems = (existingOrder?.total_items || 0) + quantity;
  
        const { error: updateOrderError } = await supabase
          .from("order")
          .update({ total_cost: updatedTotalCost, total_items: updatedTotalItems, updated_at: new Date() })
          .eq("id", orderId);
  
        if (updateOrderError) throw updateOrderError;
  
        console.log("Order timestamp updated successfully");
  
        Alert.alert("Success", "Item added to cart!");
      };
  
      if (conflictingAllergens.length > 0) {
        Alert.alert(
          "Allergy Warning",
          `This item contains allergens you've marked: ${conflictingAllergens.join(", ")}. Do you still want to add it to your cart?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Anyway",
              onPress: proceedWithAdding,
            },
          ]
        );
      } else {
        await proceedWithAdding();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart.");
    }
  };

  // Functions to handle changing the quantity of the item
  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (error || !menuItem) {
    return (
      <View style={styles.container}>
        <Text>{error || "Item not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{menuItem.name}</Text>
      <Text style={styles.price}>${menuItem.price.toFixed(2)}</Text>
      <Text style={styles.description}>{menuItem.description}</Text>

      {allergens.length > 0 && (
        <View style={styles.allergensContainer}>
          <Text style={styles.allergensTitle}>
            Select Allergens You're Allergic To:
          </Text>
          {allergens.map((allergen) => (
            <TouchableOpacity
              key={allergen.id}
              style={[
                styles.allergenButton,
                userAllergies.has(allergen.name) && styles.allergicButton,
              ]}
              onPress={() => handleAllergenPress(allergen.name)}
            >
              <Text style={styles.allergenButtonText}>{allergen.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{quantity}</Text>
        
        <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
      >
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  price: {
    fontSize: 24,
    color: "#00BFA6",
    marginVertical: 10,
  },
  description: {
    fontSize: 18,
    color: "#555",
    marginBottom: 20,
  },
  addToCartButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  addToCartButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  allergensContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  allergensTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  allergenButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#eeeeee",
    marginVertical: 5,
  },
  allergicButton: {
    backgroundColor: "#FFA07A",
  },
  allergenButtonText: {
    fontSize: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    marginBottom: 20,
  },
  quantityButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 10,
  },  
});
