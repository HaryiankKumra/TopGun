
-- Create table for storing sensor data from ESP32
CREATE TABLE public.sensor_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heart_rate INTEGER NOT NULL,
  temperature DECIMAL(5,2) NOT NULL,
  gsr_value DECIMAL(10,6),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for storing stress predictions
CREATE TABLE public.stress_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sensor_data_id UUID REFERENCES public.sensor_data(id),
  stress_level TEXT NOT NULL CHECK (stress_level IN ('low', 'medium', 'high')),
  confidence DECIMAL(5,4),
  prediction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (make data publicly accessible for this demo)
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since ESP32 will send data)
CREATE POLICY "Allow public insert on sensor_data" 
  ON public.sensor_data 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select on sensor_data" 
  ON public.sensor_data 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on stress_predictions" 
  ON public.stress_predictions 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select on stress_predictions" 
  ON public.stress_predictions 
  FOR SELECT 
  USING (true);

-- Enable realtime for live updates
ALTER TABLE public.sensor_data REPLICA IDENTITY FULL;
ALTER TABLE public.stress_predictions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stress_predictions;
