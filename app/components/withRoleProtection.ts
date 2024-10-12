import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

// Define types for props
interface WithRoleProtectionProps {
  allowedRoles: string[];
}

const withRoleProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    const router = useRouter();

    useEffect(() => {
      const checkUserRole = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const userId = session.user.id;

        const { data: profile, error } = await supabase
          .from("user")
          .select("role")
          .eq("id", userId)
          .single();

        if (error || !profile || !allowedRoles.includes(profile.role)) {
          // Redirect to login if the user doesn't have access
          router.replace("/login");
        }
      };

      checkUserRole();
    }, [router]);

    // Return the wrapped component if authorized
    return React.createElement(WrappedComponent, props);
  };

  return ProtectedComponent;
};

export default withRoleProtection;
