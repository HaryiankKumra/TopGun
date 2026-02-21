
-- Create facial_analysis table for storing camera emotion detection data
CREATE TABLE public.facial_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  emotion TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  stress_level INTEGER NOT NULL CHECK (stress_level >= 0 AND stress_level <= 100),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facial_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own facial analysis" 
  ON public.facial_analysis 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own facial analysis" 
  ON public.facial_analysis 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own facial analysis" 
  ON public.facial_analysis 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own facial analysis" 
  ON public.facial_analysis 
  FOR DELETE 
  USING (auth.uid() = user_id);
