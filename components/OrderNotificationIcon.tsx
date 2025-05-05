import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderNotificationIconProps {
  count?: number;
  color?: string;
  onPress?: () => void;
}

/**
 * A notification icon component that displays the number of pending orders
 * This is a placeholder component that will be connected to actual order functionality later
 */
const OrderNotificationIcon: React.FC<OrderNotificationIconProps> = ({ 
  count = 0, 
  color = "#00BFA6",
  onPress
}) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      accessibilityLabel="Pending orders indicator"
    >
      <Ionicons name="receipt-outline" size={24} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default OrderNotificationIcon;
