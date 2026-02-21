import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage, logError } from "@/utils/errorHandling";

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  age?: number;
  weight?: number;
  height?: number;
  blood_type?: string;
  medical_conditions?: string[];
  medications?: string[];
  allergies?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  stress_threshold_low: number;
  stress_threshold_medium: number;
  stress_threshold_high: number;
  preferred_notification_time?: string;
  activity_level?: string;
  sleep_target_hours: number;
  water_intake_target: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    profileData: Partial<UserProfile>,
  ) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safeguard: Force loading to false after 10 seconds maximum
    const maxLoadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn(
          "⚠️ Maximum loading timeout reached, forcing loading to false",
        );
        setLoading(false);
      }
    }, 10000);

    const initAuth = async () => {
      console.log("🔄 Initializing authentication...");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          throw sessionError;
        }

        if (session?.user && mounted) {
          console.log("✅ Found active session:", session.user.email);
          const supabaseUser = session.user;
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || "",
            full_name:
              supabaseUser.user_metadata?.full_name || supabaseUser.email || "",
          });

          // Fetch user profile with a delay to avoid race conditions
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(supabaseUser.id);
            }
          }, 100);
        } else {
          console.log("ℹ️ No active session");
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
      } finally {
        if (mounted) {
          console.log("✅ Auth initialization complete");
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("🔄 Auth state change:", event);

      if (session?.user) {
        const supabaseUser = session.user;
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          full_name:
            supabaseUser.user_metadata?.full_name || supabaseUser.email || "",
        });

        // Fetch profile with delay to prevent race conditions
        setTimeout(() => {
          if (mounted) {
            fetchUserProfile(supabaseUser.id);
          }
        }, 100);
      } else {
        setUser(null);
        setProfile(null);
      }

      // Always clear loading state
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(maxLoadingTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("🔄 Fetching user profile for:", userId);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Profile fetch error:", error);
        return;
      }

      if (data) {
        setProfile(data);
        console.log("✅ Profile loaded successfully");
      } else {
        console.log("ℹ️ No profile found for user, will be created on first save");
      }
    } catch (error) {
      console.error("❌ Failed to fetch user profile:", error);
      logError("Failed to fetch user profile", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const login = async (email: string, password: string) => {
    console.log("🔄 Attempting login for:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Login failed:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("✅ Login successful:", data.user.email);
        return { success: true };
      }

      return { success: false, error: "Unknown login error" };
    } catch (error) {
      console.error("❌ Login error:", error);
      logError("Login failed", error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    console.log("🔄 Attempting signup for:", email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("❌ Signup failed:", error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("✅ Signup successful:", data.user.email);
        return { success: true };
      }

      return { success: false, error: "Unknown signup error" };
    } catch (error) {
      console.error("❌ Signup error:", error);
      logError("Signup failed", error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: getErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      logError("Google login failed", error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = async () => {
    try {
      console.log("🔄 Logging out...");
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user) return { success: false, error: "Not authenticated" };

      console.log("🔄 Updating profile...");
      
      // Check if profile exists first
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Error checking existing profile:", checkError);
        return { success: false, error: getErrorMessage(checkError) };
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from("user_profiles")
          .update(profileData)
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        // Insert new profile
        result = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            ...profileData,
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error("❌ Profile update failed:", result.error);
        return { success: false, error: getErrorMessage(result.error) };
      }

      if (result.data) {
        setProfile(result.data);
        console.log("✅ Profile updated successfully");
        return { success: true };
      }

      return { success: false, error: "No data returned" };
    } catch (error) {
      console.error("❌ Profile update error:", error);
      logError("Profile update failed", error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    login,
    signup,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
