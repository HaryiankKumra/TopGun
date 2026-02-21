-- Create health records table
CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  diagnosis_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  status TEXT CHECK (status IN ('active', 'inactive', 'resolved', 'seasonal')),
  symptoms TEXT[],
  medications TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stress detections table
CREATE TABLE IF NOT EXISTS stress_detections (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 100),
  heart_rate INTEGER,
  gsr_value DECIMAL(10,2),
  temperature DECIMAL(4,1),
  emotion_detected TEXT,
  confidence DECIMAL(3,2),
  triggers TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create biometric readings table
CREATE TABLE IF NOT EXISTS biometric_readings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  heart_rate INTEGER,
  gsr_value DECIMAL(10,2),
  temperature DECIMAL(4,1),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  steps INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sensor data table for real-time ESP32 data
CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  device_id TEXT,
  heart_rate INTEGER,
  gsr_value DECIMAL(10,2),
  temperature DECIMAL(4,1),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stress predictions table for ML model outputs
CREATE TABLE IF NOT EXISTS stress_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  sensor_data_id UUID REFERENCES sensor_data(id) ON DELETE CASCADE,
  stress_level TEXT CHECK (stress_level IN ('low', 'moderate', 'high')),
  confidence DECIMAL(3,2),
  physiological_score DECIMAL(3,2),
  facial_score DECIMAL(3,2),
  combined_score DECIMAL(3,2),
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'alert', 'recommendation')),
  read BOOLEAN DEFAULT FALSE,
  action_required BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create device registrations table
CREATE TABLE IF NOT EXISTS device_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES auth_users(id) ON DELETE CASCADE,
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_type TEXT DEFAULT 'esp32',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_seen TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_condition ON health_records(condition);
CREATE INDEX IF NOT EXISTS idx_stress_detections_user_id ON stress_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_detections_timestamp ON stress_detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_biometric_readings_user_id ON biometric_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_readings_timestamp ON biometric_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_user_id ON sensor_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_id ON sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_stress_predictions_user_id ON stress_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_device_registrations_user_id ON device_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS (Row Level Security) on new tables
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for health_records
CREATE POLICY "Users can view own health records" ON health_records
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own health records" ON health_records
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own health records" ON health_records
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Policies for stress_detections
CREATE POLICY "Users can view own stress detections" ON stress_detections
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own stress detections" ON stress_detections
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policies for biometric_readings
CREATE POLICY "Users can view own biometric readings" ON biometric_readings
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own biometric readings" ON biometric_readings
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policies for sensor_data
CREATE POLICY "Users can view own sensor data" ON sensor_data
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own sensor data" ON sensor_data
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policies for stress_predictions
CREATE POLICY "Users can view own stress predictions" ON stress_predictions
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own stress predictions" ON stress_predictions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid()::text);

-- Policies for device_registrations
CREATE POLICY "Users can view own device registrations" ON device_registrations
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own device registrations" ON device_registrations
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own device registrations" ON device_registrations
    FOR UPDATE USING (user_id = auth.uid()::text);
