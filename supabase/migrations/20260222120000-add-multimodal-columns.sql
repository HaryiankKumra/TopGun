-- Add multimodal fields to biometric_data_enhanced for fusion data
ALTER TABLE public.biometric_data_enhanced
  ADD COLUMN IF NOT EXISTS facial_emotion TEXT,
  ADD COLUMN IF NOT EXISTS facial_confidence NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS wearable_stress_score INTEGER,
  ADD COLUMN IF NOT EXISTS fusion_stress_score INTEGER;
