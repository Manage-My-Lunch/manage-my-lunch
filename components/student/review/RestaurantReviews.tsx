import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import StarRating from '@/components/student/review/StarRating';

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
};

type RestaurantReviewsProps = {
  restaurantId: string;
};

export default function RestaurantReviews({ restaurantId }: RestaurantReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true);
        
        // Fetch reviews without joining profile data to avoid DB schema issues
        const { data, error } = await supabase
          .from('review')
          .select(`
            id, rating, comment, created_at, user
          `)
          .eq('restaurant', restaurantId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Process review data with basic user info
        const formattedReviews: Review[] = data.map(item => {
          return {
            id: item.id,
            rating: item.rating,
            comment: item.comment || '',
            created_at: new Date(item.created_at).toLocaleDateString(),
            user_name: 'User ' + item.user.substring(0, 4) // Use part of user ID as anonymous identifier
          };
        });
        
        setReviews(formattedReviews);
        
        // Calculate average rating
        if (formattedReviews.length > 0) {
          const sum = formattedReviews.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(parseFloat((sum / formattedReviews.length).toFixed(1)));
          setTotalReviews(formattedReviews.length);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReviews();
  }, [restaurantId]);
  
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.reviewDate}>{item.created_at}</Text>
      </View>
      <StarRating rating={item.rating} size={16} />
      {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BFA6" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Rate & Review</Text>
        {totalReviews > 0 ? (
          <>
            <View style={styles.ratingContainer}>
              <Text style={styles.averageRating}>{averageRating}</Text>
              <StarRating rating={averageRating} />
              <Text style={styles.totalReviews}>({totalReviews} reviews)</Text>
            </View>
          </>
        ) : (
          <Text style={styles.noReviews}>No reviews yet</Text>
        )}
      </View>
      
      {reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.reviewsList}
          scrollEnabled={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryContainer: {
    marginBottom: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  noReviews: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00BFA6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  comment: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
}); 