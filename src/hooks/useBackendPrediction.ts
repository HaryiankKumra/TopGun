
import { useState, useCallback } from 'react';
import { getErrorMessage, logError } from '@/utils/errorHandling';
import { analyzeWearableStress } from '@/services/huggingface';

interface PredictionData {
  data: number[][][];
}

interface PredictionResponse {
  prediction: number;
}

interface BackendPredictionResult {
  prediction: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const BACKEND_API_URL = 'https://stressmanage.duckdns.org/predict';

export const useBackendPrediction = () => {
  const [result, setResult] = useState<BackendPredictionResult>({
    prediction: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const sendPredictionRequest = useCallback(async (sensorData: Array<{
    raw_ecg_signal: number;
    gsr_value: number;
    temperature: number;
  }>) => {
    if (sensorData.length < 20) {
      console.log('Not enough sensor data for prediction (need 20 readings)');
      return;
    }

    setResult(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('Starting wearable stress prediction with Hugging Face...');
      
      // Call real Hugging Face WESAD model
      const predictionResult = await analyzeWearableStress(sensorData);
      
      console.log('Wearable stress prediction completed:', predictionResult);

      setResult({
        prediction: predictionResult.prediction,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logError('Backend prediction request', error);
      
      setResult(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setResult(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...result,
    sendPredictionRequest,
    clearError
  };
};
