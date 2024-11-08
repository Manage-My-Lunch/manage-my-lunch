import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

// Define the props type for the component
interface CustomTextInputProps extends TextInputProps {
  iconName?: keyof typeof Ionicons.glyphMap; // Optional icon name
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  iconName, // Optional icon name
  secureTextEntry = false,
  keyboardType = "default",
  ...rest
}) => {
  return (
    <View style={styles.inputContainer}>
      {iconName && (
        <Ionicons name={iconName} size={24} color="gray" style={styles.icon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        {...rest} // Pass any other props down to TextInput
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00BFA6",
    borderRadius: 8,
    backgroundColor: "#E0F7FA",
    marginVertical: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    width: "100%",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    color: "#333",
  },
});

export default CustomTextInput;
