import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

const BusyToggle = ({ isBusy, onToggle, disabled }: {
  isBusy: boolean,
  onToggle: () => void,
  disabled: boolean
}) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      style={[
        styles.toggleContainer,
        isBusy ? styles.busy : styles.open,
        disabled && { opacity: 0.6 }
      ]}
    >
      <Text style={styles.toggleText}>
        {isBusy ? "BUSY" : "OPEN"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    padding: 10,
    marginTop: 20,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  open: {
    backgroundColor: "#fff",
  },
  busy: {
    backgroundColor: "#FF6B6B",
  },
  toggleText: {
    color: "#00BFA6",
    fontWeight: "bold",
  },
});

export default BusyToggle;
