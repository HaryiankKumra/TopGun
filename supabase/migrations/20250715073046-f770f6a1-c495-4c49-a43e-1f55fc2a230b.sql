
-- Create a table for storing AI explanations
CREATE TABLE public.ai_explanations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  patient_history JSONB,
  vitals JSONB,
  predicted_stress_level TEXT,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own explanations
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own explanations
CREATE POLICY "Users can view their own AI explanations" 
  ON public.ai_explanations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own explanations
CREATE POLICY "Users can create their own AI explanations" 
  ON public.ai_explanations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
