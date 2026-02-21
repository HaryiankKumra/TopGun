
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StressPrediction {
  stressLevel: string;
  confidence: number;
  recommendations: string[];
  timestamp: string;
}

export const useStressPrediction = () => {
  const [prediction, setPrediction] = useState<StressPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPrediction = useCallback(async (sensorData: any, videoData?: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('stress-ai-prediction', {
        body: {
          sensorData,
          videoData
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.success) {
        setPrediction(data.prediction);
      } else {
        throw new Error(data.error || 'Prediction failed');
      }
    } catch (err) {
      console.error('Stress prediction error:', err);
      setError(err.message || 'Failed to get stress prediction');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    getPrediction
  };
};
