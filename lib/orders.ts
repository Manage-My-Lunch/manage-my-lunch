import { supabase } from "./supabase";

export async function getUnclaimedOrdersCount(): Promise<number> {
  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('User not authenticated:', userError);
      return 0;
    }

    const userId = userData.user.id;

    // Get paid orders that are not completed or collected
    const { data, error, count } = await supabase
      .from('order')
      .select('*', { count: 'exact' })
      .eq('user', userId)
      .is('cancelled_at', null) // Not cancelled
      .not('paid_at', 'is', null) // Paid
      .is('completed_at', null)   // Not completed
      .is('collected_at', null);  // Not collected

    if (error) {
      console.error('Error fetching unclaimed orders:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error in getUnclaimedOrdersCount:', error);
    return 0;
  }
}

/**
 * Get the count of current orders (paid but not completed)
 */
export async function getCurrentOrdersCount(): Promise<number> {
  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('User not authenticated:', userError);
      return 0;
    }

    const userId = userData.user.id;

    // Get all current orders (paid but not completed)
    const { data, error, count } = await supabase
      .from('order')
      .select('*', { count: 'exact', head: true })
      .eq('user', userId)
      .not('paid_at', 'is', null) // Paid
      .is('completed_at', null);  // Not completed

    if (error) {
      console.error('Error fetching current orders count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error in getCurrentOrdersCount:', error);
    return 0;
  }
}

export async function markOrderAsCollected(orderId: string): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error('User not authenticated:', userError);
      return false;
    }

    const userId = userData.user.id;

    const { error } = await supabase
      .from('order')
      .update({
        collected_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user', userId);

    if (error) {
      console.error('Error marking order as collected:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in markOrderAsCollected:', error);
    return false;
  }
}
