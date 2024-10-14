import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

// Define types for props
interface WithRoleProtectionProps {
  allowedRoles: string[]; // Array of roles that are allowed to access the protected component
}

/**
 * Higher-order component (HOC) to wrap a component and restrict access based on user roles.
 * This can be used to protect specific pages by only allowing access to users with the allowed roles.
 *
 * @param WrappedComponent - The component to wrap with role protection.
 * @param allowedRoles - An array of roles that are permitted to access the component.
 */
const withRoleProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  // Define a new component that will handle the role protection
  const ProtectedComponent: React.FC<P> = (props) => {
    const router = useRouter();

    useEffect(() => {
      // Function to check the current user's role and session status
      const checkUserRole = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession(); // Get the current user's session from Supabase

        // If there is no active session, redirect to the login page
        if (!session) {
          router.replace("/login");
          return;
        }

        const userId = session.user.id; // Get the current user's ID

        // Query the "user" table to get the user's role based on their ID
        const { data: profile, error } = await supabase
          .from("user")
          .select("role")
          .eq("id", userId)
          .single();

        // If there is an error, or the user's role is not in the list of allowed roles, redirect to login
        if (error || !profile || !allowedRoles.includes(profile.role)) {
          router.replace("/login");
        }
      };

      checkUserRole(); // Call the function to check the user's role when the component mounts
    }, [router]);

    // If the user is authorized, render the wrapped component with the provided props
    return React.createElement(WrappedComponent, props);
  };

  // Return the protected component
  return ProtectedComponent;
};

export default withRoleProtection;
