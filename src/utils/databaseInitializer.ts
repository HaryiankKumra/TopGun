
import { supabase } from "@/integrations/supabase/client";

interface InitializeOptions {
  force?: boolean;
  includeHealthRecords?: boolean;
  includeSampleData?: boolean;
}

export const initializeDatabaseWithSampleData = async (
  options: InitializeOptions = {},
) => {
  const {
    force = false,
    includeHealthRecords = true,
    includeSampleData = true,
  } = options;

  try {
    console.log("🔄 Initializing database with sample data...");

    // Check if we have authenticated users via Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("⚠️ No authenticated user found. Please sign up first.");
      return {
        success: false,
        error: "No authenticated user found. Please sign up first.",
      };
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingProfile && !force) {
      console.log("✅ User profile already exists, skipping re-initialization unless forced.");
      return {
        success: true,
        message: "User profile already exists, skipping initialization.",
      };
    }

    if (includeHealthRecords) {
      console.log("🏥 Creating basic health records for the user...");
      
      // Check if health records already exist
      const { data: existingRecords } = await supabase
        .from("health_records")
        .select("id")
        .eq("user_id", user.id);

      if (!existingRecords || existingRecords.length === 0 || force) {
        const { error: healthError } = await supabase
          .from("health_records")
          .insert([{
            user_id: user.id,
            condition: "General Health Checkup",
            diagnosis_date: new Date().toISOString().split('T')[0],
            severity: "low",
            status: "stable",
            symptoms: ["None"],
            medications: ["None"],
            notes: "Initial health record created during setup"
          }]);

        if (healthError) {
          console.error("❌ Failed to insert health records:", healthError.message);
          return {
            success: false,
            error: healthError.message,
          };  
        } else {
          console.log("✅ Health records inserted successfully.");
        }
      }
    }

    if (includeSampleData) {
      console.log("📊 Creating sample biometric data...");
      
      // Insert sample biometric data
      const sampleBiometricData = [
        {
          user_id: user.id,
          heart_rate: 72,
          temperature: 36.5,
          gsr_value: 0.45,
          stress_level: "low",
          stress_score: 25,
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
        {
          user_id: user.id,
          heart_rate: 85,
          temperature: 36.8,
          gsr_value: 0.62,
          stress_level: "moderate",
          stress_score: 55,
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        },
        {
          user_id: user.id,
          heart_rate: 78,
          temperature: 36.6,
          gsr_value: 0.38,
          stress_level: "low",
          stress_score: 30,
          timestamp: new Date().toISOString(), // now
        }
      ];

      const { error: biometricError } = await supabase
        .from("biometric_data_enhanced")
        .insert(sampleBiometricData);

      if (biometricError) {
        console.error("❌ Failed to insert sample biometric data:", biometricError.message);
      } else {
        console.log("✅ Sample biometric data inserted successfully.");
      }

      // Insert sample sensor data
      const sampleSensorData = [
        {
          user_id: user.id,
          heart_rate: 72,
          temperature: 36.5,
          gsr_value: 0.45,
          device_id: "ESP32_001",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          user_id: user.id,
          heart_rate: 85,
          temperature: 36.8,
          gsr_value: 0.62,
          device_id: "ESP32_001",
          timestamp: new Date().toISOString(),
        }
      ];

      const { error: sensorError } = await supabase
        .from("sensor_data")
        .insert(sampleSensorData);

      if (sensorError) {
        console.error("❌ Failed to insert sample sensor data:", sensorError.message);
      } else {
        console.log("✅ Sample sensor data inserted successfully.");
      }

      // Insert sample stress predictions
      const samplePredictions = [
        {
          user_id: user.id,
          stress_level: "low",
          confidence: 0.85,
          physiological_score: 0.3,
          facial_score: 0.2,
          combined_score: 0.25,
          heart_rate: 72,
          temperature: 36.5,
          gsr_value: 0.45,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          user_id: user.id,
          stress_level: "moderate",
          confidence: 0.92,
          physiological_score: 0.6,
          facial_score: 0.5,
          combined_score: 0.55,
          heart_rate: 85,
          temperature: 36.8,
          gsr_value: 0.62,
          timestamp: new Date().toISOString(),
        }
      ];

      const { error: predictionError } = await supabase
        .from("stress_predictions")
        .insert(samplePredictions);

      if (predictionError) {
        console.error("❌ Failed to insert sample predictions:", predictionError.message);
      } else {
        console.log("✅ Sample stress predictions inserted successfully.");
      }
    }

    console.log("🎉 Database initialization completed!");
    return {
      success: true,
      message: "Database initialized with sample data for current user.",
    };
  } catch (error) {
    console.error("💥 Database initialization failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const clearAllData = async () => {
  try {
    console.log("🗑️ Clearing user data...");
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: "No authenticated user found."
      };
    }

    // Clear user's data from all tables explicitly to avoid TypeScript errors
    await supabase.from("health_records").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from health_records");

    await supabase.from("biometric_data_enhanced").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from biometric_data_enhanced");

    await supabase.from("sensor_data").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from sensor_data");

    await supabase.from("stress_predictions").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from stress_predictions");

    await supabase.from("chat_history").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from chat_history");

    await supabase.from("daily_metrics").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from daily_metrics");

    await supabase.from("notifications").delete().eq("user_id", user.id);
    console.log("✅ Cleared data from notifications");
    
    console.log("✅ All user data cleared successfully.");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to clear data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const checkDatabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("user_profiles").select("id").limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true, data };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
    };
  }
};

export const getSampleCredentials = async () => {
  // Return sample credentials for demo purposes
  // In a real app, you'd never expose actual credentials like this
  return [
    {
      email: "demo@stressguard.ai",
      name: "Demo User",
      password: "demo123"
    },
    {
      email: "test@stressguard.ai", 
      name: "Test User",
      password: "test123"
    }
  ];
};

export const getSampleUsers = async () => {
  const credentials = await getSampleCredentials();
  return credentials.map((cred) => ({
    email: cred.email,
    name: cred.name,
  }));
};

export const getSampleUserIds = async () => {
  // Since we can't query auth.users directly, return empty array
  // This would be populated by actual authenticated users
  return [];
};

export default initializeDatabaseWithSampleData;
