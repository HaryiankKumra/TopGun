import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogIn,
  Database,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { quickConnectionTest } from "@/utils/supabaseHealthCheck";
import { Link } from "react-router-dom";

const AuthDebugger: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [refreshing, setRefreshing] = useState(false);

  const checkConnection = async () => {
    setRefreshing(true);
    try {
      const isConnected = await quickConnectionTest();
      setConnectionStatus(isConnected ? "connected" : "disconnected");
    } catch {
      setConnectionStatus("disconnected");
    }
    setRefreshing(false);
  };

  // useEffect(() => {
  //   checkConnection();
  // }, []);
// Add this somewhere inside your main App component or AuthContext
useEffect(() => {
  const hash = window.location.hash;

  if (hash.includes("access_token")) {
    const url = new URL(window.location.href.replace("#", "?"));
    const access_token = url.searchParams.get("access_token");
    const refresh_token = url.searchParams.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token,
        refresh_token,
      }).then(() => {
        // Optional: redirect after setting session
        window.history.replaceState(null, "", "/dashboard");
      }).catch((err) => {
        console.error("Failed to set session", err);
      });
    }
  }
}, []);

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-blue-300 text-sm">
              Initializing authentication...
            </span>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Database Connection:</span>
          <div className="flex items-center gap-2">
            {connectionStatus === "checking" && (
              <Badge variant="outline" className="text-xs">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
            {connectionStatus === "connected" && (
              <Badge variant="default" className="text-xs bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {connectionStatus === "disconnected" && (
              <Badge
                variant="secondary"
                className="text-xs bg-orange-500 text-white"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Offline Mode
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={checkConnection}
              disabled={refreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* User Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">User Status:</span>
          {user ? (
            <Badge variant="default" className="text-xs bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Logged In
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <XCircle className="w-3 h-3 mr-1" />
              Not Logged In
            </Badge>
          )}
        </div>

        {/* User Details */}
        {user && (
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm">User Details:</h4>
            <div className="text-xs space-y-1 pl-3 border-l-2 border-blue-500/30">
              <div>
                <span className="text-slate-400">ID:</span>{" "}
                <span className="text-slate-300">{user.id}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{" "}
                <span className="text-slate-300">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Name:</span>{" "}
                <span className="text-slate-300">{user.full_name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Profile Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Profile Status:</span>
          {profile ? (
            <Badge variant="default" className="text-xs bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Loaded
            </Badge>
          ) : user ? (
            <Badge
              variant="secondary"
              className="text-xs bg-yellow-500 text-white"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              Missing
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <XCircle className="w-3 h-3 mr-1" />
              No User
            </Badge>
          )}
        </div>

        {/* Profile Details */}
        {profile && (
          <div className="space-y-2">
            <h4 className="text-white font-medium text-sm">Profile Details:</h4>
            <div className="text-xs space-y-1 pl-3 border-l-2 border-green-500/30">
              <div>
                <span className="text-slate-400">Age:</span>{" "}
                <span className="text-slate-300">
                  {profile.age || "Not set"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Activity Level:</span>{" "}
                <span className="text-slate-300">
                  {profile.activity_level || "Not set"}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Conditions:</span>{" "}
                <span className="text-slate-300">
                  {profile.medical_conditions?.length || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!user ? (
            <Link to="/login" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </Button>
            </Link>
          ) : (
            <Link to="/dashboard" className="flex-1">
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={checkConnection}
            disabled={refreshing}
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Status Messages */}
        {!loading && !user && connectionStatus === "disconnected" && (
          <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-xs">
              <strong>Offline Mode:</strong> Database is not accessible, but you
              can still test the app using the sample login credentials.
            </p>
          </div>
        )}

        {loading && (
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs">
              <strong>Loading:</strong> If this persists, try refreshing the
              page or check the browser console for errors.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;
