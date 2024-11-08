import React from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CustomPickerProps {
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({ selectedValue, onValueChange, options, placeholder }) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.pickerContainer}>
        <Text style={styles.pickerText}>{selectedValue ? options.find(option => option.id === selectedValue)?.name : placeholder}</Text>
        <Ionicons name="chevron-down" size={20} color="gray" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item.id)} style={styles.option}>
                  <Text style={styles.optionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#00BFA6",
    borderRadius: 8,
    backgroundColor: "#E0F7FA",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
    width: "100%",
  },
  pickerText: {
    color: "#333",
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  option: {
    padding: 10,
  },
  optionText: {
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#00BFA6",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
  },
});

export default CustomPicker;
