
-- Add new columns to biometric_data_enhanced table for enhanced sensor features
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS ambient_temperature NUMERIC(4,2);
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS gsr_baseline INTEGER;
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS gsr_change INTEGER;
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS raw_ecg_signal INTEGER;
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS leads_off_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS heart_rate_variability NUMERIC(6,3);
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS arrhythmia_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.biometric_data_enhanced ADD COLUMN IF NOT EXISTS device_status JSONB;

-- Update the sensor_data table as well for consistency
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS ambient_temperature NUMERIC(4,2);
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS gsr_baseline INTEGER;
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS gsr_change INTEGER;
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS raw_ecg_signal INTEGER;
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS leads_off_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS heart_rate_variability NUMERIC(6,3);
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS arrhythmia_detected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.sensor_data ADD COLUMN IF NOT EXISTS device_status JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.biometric_data_enhanced.ambient_temperature IS 'Room/environmental temperature from MLX90614';
COMMENT ON COLUMN public.biometric_data_enhanced.gsr_baseline IS 'Calibrated GSR baseline value';
COMMENT ON COLUMN public.biometric_data_enhanced.gsr_change IS 'GSR change from baseline (stress indicator)';
COMMENT ON COLUMN public.biometric_data_enhanced.raw_ecg_signal IS 'Raw ECG waveform analog value';
COMMENT ON COLUMN public.biometric_data_enhanced.leads_off_detected IS 'Whether ECG electrodes are properly connected';
COMMENT ON COLUMN public.biometric_data_enhanced.heart_rate_variability IS 'Heart rate variability measurement';
COMMENT ON COLUMN public.biometric_data_enhanced.arrhythmia_detected IS 'Whether irregular heartbeat was detected';
COMMENT ON COLUMN public.biometric_data_enhanced.device_status IS 'JSON object containing device status information';
