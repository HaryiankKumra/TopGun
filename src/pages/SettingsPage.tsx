
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User,
  Heart,
  Shield,
  Bell,
  Palette,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Droplets,
  Moon,
  AlertTriangle,
} from "lucide-react";

interface UserProfile {
  age: number | null;
  weight: number | null;
  height: number | null;
  blood_type: string | null;
  activity_level: string | null;
  medical_conditions: string[] | null;
  medications: string[] | null;
  allergies: string[] | null;
  sleep_target_hours: number | null;
  water_intake_target: number | null;
  stress_threshold_low: number | null;
  stress_threshold_medium: number | null;
  stress_threshold_high: number | null;
  preferred_notification_time: string | null;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    age: null,
    weight: null,
    height: null,
    blood_type: null,
    activity_level: null,
    medical_conditions: null,
    medications: null,
    allergies: null,
    sleep_target_hours: 8,
    water_intake_target: 2000,
    stress_threshold_low: 30,
    stress_threshold_medium: 60,
    stress_threshold_high: 80,
    preferred_notification_time: null,
  });

  // Get display name from user email
  const displayName = user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      console.log("🔄 Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching profile:", error);
        return;
      }

      if (data) {
        console.log("✅ Profile found:", data);
        setProfile({
          age: data.age,
          weight: data.weight,
          height: data.height,
          blood_type: data.blood_type,
          activity_level: data.activity_level,
          medical_conditions: data.medical_conditions,
          medications: data.medications,
          allergies: data.allergies,
          sleep_target_hours: data.sleep_target_hours,
          water_intake_target: data.water_intake_target,
          stress_threshold_low: data.stress_threshold_low,
          stress_threshold_medium: data.stress_threshold_medium,
          stress_threshold_high: data.stress_threshold_high,
          preferred_notification_time: data.preferred_notification_time,
        });
      } else {
        console.log("ℹ️ No profile found, using defaults");
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  };

  const updateProfile = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to update your profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Updating profile for user:", user.id);
      console.log("Profile data:", profile);

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Error checking existing profile:", checkError);
        throw checkError;
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log("🔄 Updating existing profile");
        result = await supabase
          .from("user_profiles")
          .update({
            ...profile,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        // Insert new profile
        console.log("🔄 Creating new profile");
        result = await supabase
          .from("user_profiles")
          .insert({
            user_id: user.id,
            ...profile,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error("❌ Profile operation failed:", result.error);
        throw result.error;
      }

      console.log("✅ Profile saved successfully:", result.data);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      console.error("❌ Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
  };

  const calculateBMI = () => {
    if (profile.weight && profile.height) {
      const heightInM = profile.height / 100;
      return (profile.weight / (heightInM * heightInM)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-500" };
    if (bmi < 25) return { category: "Normal", color: "text-green-500" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-500" };
    return { category: "Obese", color: "text-red-500" };
  };

  const bmi = calculateBMI();
  const bmiData = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your profile and preferences
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* User Info Card */}
        <Card className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <User className="w-5 h-5 text-blue-500" />
              </div>
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Display Name</Label>
                <Input
                  id="name"
                  value={displayName}
                  disabled
                  className="bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Display name is automatically set from your Google account or email
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Health Profile */}
        <Card className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              Health Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age" className="text-slate-700 dark:text-slate-300">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, age: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-slate-700 dark:text-slate-300">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={profile.weight || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, weight: parseFloat(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-slate-700 dark:text-slate-300">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, height: parseFloat(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>

            {bmi && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-slate-900 dark:text-white">BMI: {bmi}</span>
                  <Badge className={`${bmiData?.color} bg-transparent border-current`}>
                    {bmiData?.category}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="blood_type" className="text-slate-700 dark:text-slate-300">Blood Type</Label>
                <Input
                  id="blood_type"
                  value={profile.blood_type || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, blood_type: e.target.value })
                  }
                  placeholder="e.g., A+, B-, O+"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="activity_level" className="text-slate-700 dark:text-slate-300">Activity Level</Label>
                <Input
                  id="activity_level"
                  value={profile.activity_level || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, activity_level: e.target.value })
                  }
                  placeholder="e.g., Sedentary, Active, Very Active"
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Targets */}
        <Card className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              Daily Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sleep_target" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Sleep Target (hours)
                </Label>
                <Input
                  id="sleep_target"
                  type="number"
                  step="0.5"
                  value={profile.sleep_target_hours || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, sleep_target_hours: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="water_target" className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Water Intake Target (ml)
                </Label>
                <Input
                  id="water_target"
                  type="number"
                  value={profile.water_intake_target || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, water_intake_target: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Thresholds */}
        <Card className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-orange-500/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              Stress Alert Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stress_low" className="text-slate-700 dark:text-slate-300">Low Stress (%)</Label>
                <Input
                  id="stress_low"
                  type="number"
                  value={profile.stress_threshold_low || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, stress_threshold_low: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="stress_medium" className="text-slate-700 dark:text-slate-300">Medium Stress (%)</Label>
                <Input
                  id="stress_medium"
                  type="number"
                  value={profile.stress_threshold_medium || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, stress_threshold_medium: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
              <div>
                <Label htmlFor="stress_high" className="text-slate-700 dark:text-slate-300">High Stress (%)</Label>
                <Input
                  id="stress_high"
                  type="number"
                  value={profile.stress_threshold_high || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, stress_threshold_high: parseInt(e.target.value) || null })
                  }
                  className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="bg-white/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medical_conditions" className="text-slate-700 dark:text-slate-300">Medical Conditions</Label>
              <Textarea
                id="medical_conditions"
                value={profile.medical_conditions?.join(", ") || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    medical_conditions: e.target.value
                      ? e.target.value.split(",").map((s) => s.trim())
                      : null,
                  })
                }
                placeholder="Enter medical conditions separated by commas"
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
            <div>
              <Label htmlFor="medications" className="text-slate-700 dark:text-slate-300">Current Medications</Label>
              <Textarea
                id="medications"
                value={profile.medications?.join(", ") || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    medications: e.target.value
                      ? e.target.value.split(",").map((s) => s.trim())
                      : null,
                  })
                }
                placeholder="Enter medications separated by commas"
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
            <div>
              <Label htmlFor="allergies" className="text-slate-700 dark:text-slate-300">Allergies</Label>
              <Textarea
                id="allergies"
                value={profile.allergies?.join(", ") || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    allergies: e.target.value
                      ? e.target.value.split(",").map((s) => s.trim())
                      : null,
                  })
                }
                placeholder="Enter allergies separated by commas"
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={updateProfile}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 dark:text-slate-400 text-sm py-4">
          <p>StressGuard AI - Developed by Haryiank Kumra</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
