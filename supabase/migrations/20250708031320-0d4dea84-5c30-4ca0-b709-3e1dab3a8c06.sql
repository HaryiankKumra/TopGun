
-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  age INTEGER,
  weight DECIMAL,
  height DECIMAL,
  blood_type TEXT,
  medical_conditions TEXT[],
  medications TEXT[],
  allergies TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  stress_threshold_low INTEGER DEFAULT 30,
  stress_threshold_medium INTEGER DEFAULT 60,
  stress_threshold_high INTEGER DEFAULT 80,
  preferred_notification_time TIME,
  activity_level TEXT,
  sleep_target_hours INTEGER DEFAULT 8,
  water_intake_target INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create biometric data table
CREATE TABLE public.biometric_data_enhanced (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate INTEGER,
  temperature DECIMAL,
  gsr_value DECIMAL,
  stress_level TEXT,
  stress_score INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health records table
CREATE TABLE public.health_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  condition TEXT NOT NULL,
  diagnosis_date DATE,
  severity TEXT,
  status TEXT,
  symptoms TEXT[],
  medications TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_data_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create RLS policies for biometric_data_enhanced
CREATE POLICY "Users can view their own biometric data" 
  ON public.biometric_data_enhanced 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric data" 
  ON public.biometric_data_enhanced 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for health_records
CREATE POLICY "Users can view their own health records" 
  ON public.health_records 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health records" 
  ON public.health_records 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records" 
  ON public.health_records 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records" 
  ON public.health_records 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, stress_threshold_low, stress_threshold_medium, stress_threshold_high, sleep_target_hours, water_intake_target)
  VALUES (NEW.id, 30, 60, 80, 8, 2000);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
