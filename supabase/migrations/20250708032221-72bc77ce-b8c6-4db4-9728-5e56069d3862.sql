
-- Create sensor_data table for ESP32 biometric sensor readings
CREATE TABLE IF NOT EXISTS public.sensor_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  temperature DECIMAL(4,2),
  gsr_value DECIMAL(6,4),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  device_id TEXT
);

-- Create stress_predictions table for AI results
CREATE TABLE IF NOT EXISTS public.stress_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create chat_history table for AI chatbot
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id UUID
);

-- Create daily_metrics table
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for sensor_data
CREATE POLICY "Users can view their own sensor data" ON public.sensor_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sensor data" ON public.sensor_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for stress_predictions
CREATE POLICY "Users can view their own predictions" ON public.stress_predictions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own predictions" ON public.stress_predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for chat_history
CREATE POLICY "Users can view their own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat messages" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for daily_metrics
CREATE POLICY "Users can manage their own daily metrics" ON public.daily_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_user_id ON public.sensor_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON public.sensor_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_stress_predictions_user_id ON public.stress_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_predictions_timestamp ON public.stress_predictions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_timestamp ON public.chat_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
