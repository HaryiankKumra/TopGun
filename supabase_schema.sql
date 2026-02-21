-- =============================================
-- STRESSGUARD AI - COMPLETE DATABASE SCHEMA
-- =============================================
-- Run this SQL in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    blood_type VARCHAR(10),
    medical_conditions TEXT[],
    medications TEXT[],
    allergies TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    stress_threshold_low INTEGER DEFAULT 30,
    stress_threshold_medium INTEGER DEFAULT 60,
    stress_threshold_high INTEGER DEFAULT 80,
    preferred_notification_time TIME,
    activity_level VARCHAR(50),
    sleep_target_hours INTEGER DEFAULT 8,
    water_intake_target INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. SENSOR DATA TABLE (ESP32 data)
-- =============================================
CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    heart_rate INTEGER,
    temperature DECIMAL(4,2),
    gsr_value DECIMAL(6,4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_id TEXT
);

-- =============================================
-- 3. STRESS PREDICTIONS TABLE (AI results)
-- =============================================
CREATE TABLE IF NOT EXISTS stress_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stress_level VARCHAR(20) CHECK (stress_level IN ('low', 'moderate', 'high', 'severe')),
    confidence DECIMAL(4,3),
    physiological_score DECIMAL(4,3),
    facial_score DECIMAL(4,3),
    combined_score DECIMAL(4,3),
    heart_rate INTEGER,
    temperature DECIMAL(4,2),
    gsr_value DECIMAL(6,4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. CHAT HISTORY TABLE (AI chatbot)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID
);

-- =============================================
-- 5. HEALTH RECORDS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS health_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    record_type VARCHAR(50),
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    doctor_name TEXT,
    notes TEXT,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. DAILY METRICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    avg_stress_level DECIMAL(4,3),
    max_stress_level DECIMAL(4,3),
    min_stress_level DECIMAL(4,3),
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    min_heart_rate INTEGER,
    sleep_hours DECIMAL(3,1),
    water_intake INTEGER,
    exercise_minutes INTEGER,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================
-- 7. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. API KEYS TABLE (for user's API configurations)
-- =============================================
CREATE TABLE IF NOT EXISTS user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- =============================================
-- 9. DEVICE CONFIGURATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS device_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- =============================================
-- 10. STRESS EVENTS TABLE (for tracking stress episodes)
-- =============================================
CREATE TABLE IF NOT EXISTS stress_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    peak_stress_level DECIMAL(4,3),
    avg_stress_level DECIMAL(4,3),
    trigger_category VARCHAR(100),
    trigger_description TEXT,
    coping_strategy TEXT,
    outcome_rating INTEGER CHECK (outcome_rating >= 1 AND outcome_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_events ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for sensor_data
CREATE POLICY "Users can view their own sensor data" ON sensor_data
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sensor data" ON sensor_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for stress_predictions
CREATE POLICY "Users can view their own predictions" ON stress_predictions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON stress_predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for chat_history
CREATE POLICY "Users can view their own chat history" ON chat_history
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages" ON chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for health_records
CREATE POLICY "Users can manage their own health records" ON health_records
    FOR ALL USING (auth.uid() = user_id);

-- Policies for daily_metrics
CREATE POLICY "Users can manage their own daily metrics" ON daily_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Policies for user_api_keys
CREATE POLICY "Users can manage their own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Policies for device_configs
CREATE POLICY "Users can manage their own devices" ON device_configs
    FOR ALL USING (auth.uid() = user_id);

-- Policies for stress_events
CREATE POLICY "Users can manage their own stress events" ON stress_events
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_user_id ON sensor_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stress_predictions_user_id ON stress_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_predictions_timestamp ON stress_predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON chat_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_device_configs_user_id ON device_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_events_user_id ON stress_events(user_id);

-- =============================================
-- CREATE FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMPLETED SCHEMA SETUP
-- =============================================
-- Copy and paste this entire SQL script into your Supabase SQL editor and run it.
-- This will create all necessary tables, indexes, and security policies.
