
import { supabase } from "@/integrations/supabase/client";

interface HealthCheckResult {
  connected: boolean;
  tablesExist: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

const requiredTables = [
  "user_profiles",
  "health_records", 
  "biometric_data_enhanced",
  "contact_messages",
  "sensor_data",
  "stress_predictions",
  "chat_history",
  "daily_metrics",
  "notifications",
];

export const performSupabaseHealthCheck = async (): Promise<HealthCheckResult> => {
  const result: HealthCheckResult = {
    connected: false,
    tablesExist: false,
    errors: [],
    warnings: [],
    recommendations: [],
  };

  try {
    console.log("🔍 Testing Supabase connection...");
    const { error: connectionError } = await supabase
      .from("user_profiles")
      .select("id")
      .limit(1);

    if (connectionError) {
      result.errors.push(`Connection failed: ${connectionError.message}`);

      if (connectionError.message.includes('relation "user_profiles" does not exist')) {
        result.recommendations.push(
          "Run migrations or the database initializer to create missing tables."
        );
      } else if (connectionError.message.includes("Invalid API key")) {
        result.recommendations.push("Check your Supabase API key and URL in .env.");
      } else {
        result.recommendations.push("Check Supabase configuration and network.");
      }
      return result;
    }

    result.connected = true;
    console.log("✅ Supabase connection successful");

    console.log("🔍 Checking required tables...");
    let allTablesExist = true;
    const missingTables: string[] = [];

    for (const table of requiredTables) {
      const { error: tableError } = await (supabase as any)
        .from(table)
        .select("id")
        .limit(1);

      if (tableError) {
        if (tableError.message.includes("does not exist")) {
          missingTables.push(table);
          allTablesExist = false;
        } else {
          result.warnings.push(`⚠️ Table ${table}: ${tableError.message}`);
        }
      }
    }

    result.tablesExist = allTablesExist;

    if (!allTablesExist) {
      result.warnings.push(`Missing tables: ${missingTables.join(", ")}`);
      result.recommendations.push(
        "Run database initializer to create missing tables and sample data."
      );
    } else {
      console.log("✅ All required tables exist.");
    }

    console.log("🔍 Checking for sample data...");
    const { data: userData, error: userError, count } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    if (userError) {
      result.warnings.push("Could not verify sample user data.");
    } else if (count === 0) {
      result.warnings.push("⚠️ No user profiles found.");
      result.recommendations.push("Run initializer to insert sample data for testing.");
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log("🎉 Supabase health check passed completely!");
    }
  } catch (error) {
    result.errors.push(
      `Health check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    result.recommendations.push("Check your internet connection and Supabase status.");
  }

  return result;
};

export const autoFixCommonIssues = async (): Promise<{
  fixed: string[];
  failed: string[];
}> => {
  const result = { fixed: [], failed: [] };

  try {
    console.log("🔧 Attempting auto-fix checks...");

    const testData = {
      id: "health-check-test",
      user_id: "test-user",
      heart_rate: 72,
      temperature: 36.5,
      gsr_value: 0.5,
      timestamp: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("biometric_data_enhanced").insert(testData);
    if (insertError) {
      result.failed.push(`Database write test failed: ${insertError.message}`);
    } else {
      await supabase.from("biometric_data_enhanced").delete().eq("id", "health-check-test");
      result.fixed.push("Database write permissions verified.");
    }
  } catch (error) {
    result.failed.push(`Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
};

export const getSupabaseStatus = async () => {
  const healthCheck = await performSupabaseHealthCheck();

  return {
    status: healthCheck.connected ? "connected" : "disconnected",
    health: healthCheck.errors.length === 0 ? "healthy" : "unhealthy",
    details: healthCheck,
    timestamp: new Date().toISOString(),
  };
};

export const quickConnectionTest = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from("user_profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
};

export default performSupabaseHealthCheck;
