import { Text, View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Modal, Button } from "react-native";
import withRoleProtection from "@/components/withRoleProtection";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types";

function Index() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [redeemableVouchers, setRedeemableVouchers] = useState(0);

  // Function to redeem points for vouchers
  const redeemPointsForVouchers = async () => {
    try {
      if (!profile) return;
      
      // Calculate how many vouchers can be redeemed
      const pointsToRedeem = redeemableVouchers * 10;
      const remainingPoints = profile.points - pointsToRedeem;
      const newVoucherCount = (profile.voucher_count || 0) + redeemableVouchers;
      
      // Update the user's points and voucher count in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("user")
        .update({ 
          points: remainingPoints, 
          voucher_count: newVoucherCount 
        })
        .eq("id", user?.id);
      
      if (error) {
        console.error("Error updating rewards:", error);
        Alert.alert("Error", "Unable to redeem vouchers");
        return;
      }
      
      // Update the local state
      setProfile({
        ...profile,
        points: remainingPoints,
        voucher_count: newVoucherCount
      });
      
      Alert.alert("Success", `You've redeemed ${redeemableVouchers} voucher${redeemableVouchers !== 1 ? 's' : ''}!`);
      setModalVisible(false);
      setRedeemableVouchers(0);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "An error occurred while redeeming vouchers");
    }
  };
  
  // Calculate maximum number of vouchers that can be redeemed
  const calculateMaxVouchers = () => {
    if (!profile) return 0;
    return Math.floor((profile.points || 0) / 10);
  };
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get the current user from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          Alert.alert("Error", "Unable to fetch user information");
          setLoading(false);
          return;
        }
        
        // Get the user's profile from the user table
        const { data, error } = await supabase
          .from("user")
          .select("id, points, voucher_count")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          Alert.alert("Error", "Unable to fetch rewards information");
        } else {
          setProfile(data as UserProfile);
        }
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Error", "An error occurred while fetching your rewards");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Points</Text>
        <Text style={styles.pointsText}>{profile?.points || 0} / 10</Text>
        <View style={styles.progressContainer}>
          <View 
            style={[styles.progressBar, { width: `${((profile?.points || 0) % 10) / 10 * 100}%` }]} 
          />
        </View>
        <Text style={styles.infoText}>
          Complete 10 orders to earn a $15 voucher
        </Text>
        {calculateMaxVouchers() > 0 && (
          <TouchableOpacity 
            style={styles.redeemButton} 
            onPress={() => {
              setRedeemableVouchers(1); // Default to 1 voucher
              setModalVisible(true);
            }}
          >
            <Text style={styles.redeemButtonText}>Redeem Vouchers</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Available Vouchers</Text>
        <Text style={styles.voucherCount}>{profile?.voucher_count || 0}</Text>
        <Text style={styles.infoText}>
    {'\n'}Save $15 per voucher at checkout{'\n'}
    <Text style={{ color: '#4a90e2', fontWeight: 'bold' }}>Stack them for more discounts!</Text>
  </Text>
      </View>
      
      {/* Redemption Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Redeem Vouchers</Text>
            
            <Text style={styles.modalText}>
              You have {profile?.points || 0} points, which can be redeemed for up to {calculateMaxVouchers()} voucher{calculateMaxVouchers() !== 1 ? 's' : ''}.
            </Text>
            
            <View style={styles.voucherSelector}>
              <Button 
                title="-" 
                onPress={() => setRedeemableVouchers(Math.max(1, redeemableVouchers - 1))}
                disabled={redeemableVouchers <= 1}
              />
              <Text style={styles.voucherNumber}>{redeemableVouchers}</Text>
              <Button 
                title="+" 
                onPress={() => setRedeemableVouchers(Math.min(calculateMaxVouchers(), redeemableVouchers + 1))}
                disabled={redeemableVouchers >= calculateMaxVouchers()}
              />
            </View>
            
            <Text style={styles.costText}>Cost: {redeemableVouchers * 10} points</Text>
            
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <Button title="Redeem" onPress={redeemPointsForVouchers} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },

  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4a90e2',
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 6,
  },
  voucherCount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#27ae60',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  redeemButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  voucherSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  voucherNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
  },
  costText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
export default withRoleProtection(Index, ["student"]);