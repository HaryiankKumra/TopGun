import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log("🔄 Processing OAuth callback...");
      console.log("🔍 Current URL:", window.location.href);
      console.log("🔍 Hash:", window.location.hash);
      
      try {
        // Check if there's an access_token in the URL hash (Supabase OAuth flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          console.log("✅ Found access token in URL, setting session...");
          
          // Set the session manually from URL tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error("❌ Error setting session:", error);
            navigate("/login", { state: { error: "Authentication failed. Please try again." } });
            return;
          }
          
          if (data.session) {
            console.log("✅ Session established:", data.session.user.email);
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 300);
            return;
          }
        }
        
        // Fallback: Try to get existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("❌ OAuth session error:", error);
          navigate("/login", { 
            state: { error: "Authentication failed. Please try again." }
          });
          return;
        }

        if (data.session) {
          console.log("✅ OAuth session established:", data.session.user.email);
          setTimeout(() => {
            console.log("✅ Redirecting to dashboard");
            navigate("/dashboard", { replace: true });
          }, 300);
        } else {
          console.log("ℹ️ No session found, redirecting to login");
          navigate("/login");
        }
      } catch (error) {
        console.error("❌ OAuth callback error:", error);
        navigate("/login", { 
          state: { error: "Authentication failed. Please try again." }
        });
      } finally {
        setIsProcessing(false);
      }
    };

    // Only process if still loading or no user yet
    if (isProcessing) {
      handleOAuthCallback();
    }
  }, [navigate, isProcessing]);

  // If auth is loaded and user exists, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      console.log("✅ User authenticated, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-300">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
