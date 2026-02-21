
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  BellOff,
  AlertTriangle,
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Heart,
  Brain,
  Zap,
} from "lucide-react";

interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  stressThreshold: number;
  heartRateThreshold: number;
  frequency: number; // minutes between notifications
}

const StressAlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    soundEnabled: true,
    stressThreshold: 70,
    heartRateThreshold: 100,
    frequency: 5,
  });
  const [loading, setLoading] = useState(true);
  const [currentStressData, setCurrentStressData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUserSettings();
      fetchCurrentStressData();
      
      // Set up real-time monitoring
      const interval = setInterval(() => {
        checkStressLevels();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("stress_threshold_high, preferred_notification_time")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(prev => ({
          ...prev,
          stressThreshold: data.stress_threshold_high || 70,
        }));
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStressData = async () => {
    try {
      const { data, error } = await supabase
        .from("biometric_data_enhanced")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentStressData(data);
    } catch (error) {
      console.error("Error fetching current stress data:", error);
    }
  };

  const checkStressLevels = async () => {
    if (!settings.enabled || !user) return;

    try {
      const { data, error } = await supabase
        .from("biometric_data_enhanced")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const stressScore = data.stress_score || 0;
      const heartRate = data.heart_rate || 0;

      // Check if stress threshold is exceeded
      if (stressScore >= settings.stressThreshold) {
        await sendNotification(
          "High Stress Alert",
          `Your stress level is at ${stressScore}%. Consider taking a break and practicing relaxation techniques.`,
          "high",
          "stress"
        );
        
        if (settings.soundEnabled) {
          playAlertSound();
        }
      }

      // Check if heart rate threshold is exceeded
      if (heartRate >= settings.heartRateThreshold) {
        await sendNotification(
          "Elevated Heart Rate",
          `Your heart rate is ${heartRate} BPM. Take deep breaths and monitor your activity.`,
          "medium",
          "heart_rate"
        );
        
        if (settings.soundEnabled) {
          playAlertSound();
        }
      }

      setCurrentStressData(data);
    } catch (error) {
      console.error("Error checking stress levels:", error);
    }
  };

  const sendNotification = async (title: string, message: string, priority: string, type: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .insert({
          user_id: user?.id,
          title,
          message,
          priority,
          type,
          read: false,
        });

      if (error) throw error;

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
        });
      }

      // Refresh notifications list
      fetchNotifications();

      toast({
        title: "Alert Sent",
        description: message,
        variant: priority === "high" ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const playAlertSound = () => {
    // Create audio context and play bell sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      // Update user profile with new thresholds
      const { error } = await supabase
        .from("user_profiles")
        .update({
          stress_threshold_high: updatedSettings.stressThreshold,
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive browser notifications for stress alerts.",
        });
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
      
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-4 lg:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
              Stress Alerts & Notifications
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor and receive alerts for elevated stress levels and heart rate
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStressData ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Stress Level</p>
                    <p className={`text-2xl font-bold ${
                      (currentStressData.stress_score || 0) >= settings.stressThreshold 
                        ? 'text-red-600' 
                        : (currentStressData.stress_score || 0) >= 50 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                    }`}>
                      {currentStressData.stress_score || 0}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Heart Rate</p>
                    <p className={`text-2xl font-bold ${
                      (currentStressData.heart_rate || 0) >= settings.heartRateThreshold 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {currentStressData.heart_rate || 0} BPM
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">No recent data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Alert Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <Label htmlFor="sound-enabled">Sound Alerts</Label>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stress-threshold">Stress Alert Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="stress-threshold"
                    type="number"
                    min="50"
                    max="100"
                    value={settings.stressThreshold}
                    onChange={(e) => updateSettings({ stressThreshold: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heart-rate-threshold">Heart Rate Alert Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="heart-rate-threshold"
                    type="number"
                    min="80"
                    max="200"
                    value={settings.heartRateThreshold}
                    onChange={(e) => updateSettings({ heartRateThreshold: parseInt(e.target.value) })}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">BPM</span>
                </div>
              </div>

              <Button onClick={requestNotificationPermission} className="w-full">
                Enable Browser Notifications
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Notifications History */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-700 opacity-60' 
                        : 'bg-white dark:bg-gray-600 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(notification.priority || 'normal')}>
                            {notification.priority || 'normal'}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-300">No notifications yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You'll receive alerts when stress levels exceed your thresholds
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StressAlertsPage;
