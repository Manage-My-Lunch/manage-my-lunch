import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type StarRatingProps = {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = 24,
  color = '#FFD700',
  editable = false,
  onRatingChange
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array(maxRating)
        .fill(0)
        .map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => editable && onRatingChange && onRatingChange(i + 1)}
            disabled={!editable}
          >
            <Text
              style={[
                styles.star,
                {
                  fontSize: size,
                  color: i < rating ? color : '#CCCCCC'
                }
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  }
}); 