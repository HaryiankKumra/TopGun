/**
 * Hugging Face API Integration Service
 * Provides interfaces to interact with ML models hosted on Hugging Face Spaces
 * 
 * NOTE: Uses Supabase Edge Functions as proxies to bypass CORS issues
 * and handle API calls server-side for better reliability
 */

import { supabase } from '@/integrations/supabase/client';

// Fallback to direct API calls if Edge Functions are unavailable
const FACIAL_STRESS_API = import.meta.env.VITE_FACIAL_STRESS_API || "https://haryiank-facial-stress.hf.space";
// Updated to use your Hugging Face Space: Haryiank/stress-detector
const WEARABLE_STRESS_API = import.meta.env.VITE_WEARABLE_STRESS_API || "https://Haryiank-stress-detector.hf.space";

// Use Edge Functions for better reliability (bypasses CORS, handles retries)
const USE_EDGE_FUNCTIONS = true;

export interface FacialStressResult {
  emotion: string;
  stress_level: string;
  confidence: number;
  timestamp: string;
  warning?: string;
}

export interface WearableStressResult {
  prediction: number;
  stress_level: string;
  confidence: number;
  timestamp: string;
  warning?: string;
}

/**
 * Analyze facial image for stress detection
 * @param imageBlob - Base64 encoded image or Blob
 * @returns Facial stress analysis result
 */
export async function analyzeFacialStress(imageBlob: Blob | string): Promise<FacialStressResult> {
  try {
    console.log('📸 Starting facial stress analysis...');
    
    // Convert string (base64/URL) to Blob if needed
    let blob: Blob;
    if (typeof imageBlob === 'string') {
      const response = await fetch(imageBlob);
      blob = await response.blob();
    } else {
      blob = imageBlob;
    }

    // Try Edge Function first (bypasses CORS, more reliable)
    if (USE_EDGE_FUNCTIONS) {
      try {
        console.log('🔄 Using Edge Function proxy for facial stress analysis');
        
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');

        const { data, error } = await supabase.functions.invoke('facial-stress-proxy', {
          body: formData,
        });

        if (error) {
          console.warn('⚠️ Edge Function error:', error);
          throw error;
        }

        if (data) {
          console.log('✅ Facial stress analysis successful (via Edge Function)');
          if (data.warning) {
            console.warn('⚠️', data.warning);
          }
          return data as FacialStressResult;
        }
      } catch (edgeFunctionError) {
        console.warn('⚠️ Edge Function failed, falling back to direct API call:', edgeFunctionError);
        // Fall through to direct API call
      }
    }

    // Fallback: Direct API call (may have CORS issues)
    console.log('🔄 Using direct Hugging Face API call');
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');

    const response = await fetch(`${FACIAL_STRESS_API}/api/predict`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Facial stress API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      emotion: data.emotion || 'neutral',
      stress_level: data.stress_level || 'Not Stressed',
      confidence: data.confidence || 0.5,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing facial stress:', error);
    throw error;
  }
}

/**
 * Analyze wearable sensor data for stress detection
 * @param sensorData - Array of sensor readings (ECG, GSR, temperature)
 * @returns Wearable stress prediction result
 */
export async function analyzeWearableStress(sensorData: Array<{
  raw_ecg_signal: number;
  gsr_value: number;
  temperature: number;
}>): Promise<WearableStressResult> {
  try {
    console.log('Starting wearable stress analysis...');
    
    if (sensorData.length < 20) {
      throw new Error('Insufficient sensor data. Need at least 20 readings.');
    }

    // Try Edge Function first (bypasses CORS, more reliable)
    if (USE_EDGE_FUNCTIONS) {
      try {
        console.log('Using Edge Function proxy for wearable stress analysis');
        
        const { data, error } = await supabase.functions.invoke('wearable-stress-proxy', {
          body: { sensorData },
        });

        if (error) {
          console.warn('Edge Function error:', error);
          throw error;
        }

        if (data) {
          console.log('Wearable stress analysis successful (via Edge Function)');
          if (data.warning) {
            console.warn('Warning:', data.warning);
          }
          return data as WearableStressResult;
        }
      } catch (edgeFunctionError) {
        console.warn('Edge Function failed, falling back to direct API call:', edgeFunctionError);
        // Fall through to direct API call
      }
    }

    // Fallback: Direct API call (may have CORS issues)
    console.log('Using direct Hugging Face API call');
    const recentData = sensorData.slice(-20);

    const formattedData = {
      data: recentData.map(reading => [
        reading.raw_ecg_signal,
        reading.gsr_value,
        reading.temperature
      ])
    };

    const response = await fetch(`${WEARABLE_STRESS_API}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });

    if (!response.ok) {
      throw new Error(`Wearable stress API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Prediction: 0 = Not Stressed, 1 = Stressed
    const isStressed = data.prediction === 1;
    
    return {
      prediction: data.prediction,
      stress_level: isStressed ? 'Stressed' : 'Not Stressed',
      confidence: data.confidence || 0.85,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error analyzing wearable stress:', error);
    throw error;
  }
}

// ─── Speech Stress ────────────────────────────────────────────────────────────

export interface SpeechStressResult {
  emotion: string;
  stressScore: number;   // 0–1
  confidence: number;    // 0–1
  warning?: string;
}

/**
 * Analyse an audio blob for speech emotion / stress using
 * the HuggingFace Inference API (superb/wav2vec2-base-superb-er)
 * routed through the speech-stress-proxy Supabase Edge Function.
 *
 * @param audioBlob - Raw audio Blob recorded from the browser microphone
 */
export async function analyzeSpeechStress(audioBlob: Blob): Promise<SpeechStressResult> {
  try {
    console.log('🎤 Starting speech stress analysis via Edge Function…');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const { data, error } = await supabase.functions.invoke('speech-stress-proxy', {
      body: formData,
    });

    if (error) {
      console.warn('⚠️ speech-stress-proxy error:', error);
      throw new Error(error.message);
    }

    if (data?.error) throw new Error(data.error);

    console.log('✅ Speech stress result:', data);
    if (data.warning) console.warn('⚠️', data.warning);

    return {
      emotion:     data.emotion     ?? 'neutral',
      stressScore: data.stressScore ?? 0.4,
      confidence:  data.confidence  ?? 0,
      warning:     data.warning,
    } as SpeechStressResult;
  } catch (err) {
    console.error('Error analysing speech stress:', err);
    throw err;
  }
}

/**
 * Combined analysis using both facial and wearable data
 * @param imageBlob - Facial image
 * @param sensorData - Wearable sensor readings
 * @returns Combined stress analysis result
 */
export async function analyzeCombinedStress(
  imageBlob: Blob | string,
  sensorData: Array<{
    raw_ecg_signal: number;
    gsr_value: number;
    temperature: number;
  }>
): Promise<{
  facial: FacialStressResult;
  wearable: WearableStressResult;
  combined_stress_level: string;
  overall_confidence: number;
}> {
  try {
    // Run both analyses in parallel
    const [facialResult, wearableResult] = await Promise.all([
      analyzeFacialStress(imageBlob),
      analyzeWearableStress(sensorData),
    ]);

    // Combine results - if either shows stress, overall is stressed
    const facialStressed = facialResult.stress_level === 'Stressed';
    const wearableStressed = wearableResult.stress_level === 'Stressed';
    
    const combinedStressLevel = facialStressed || wearableStressed ? 'Stressed' : 'Not Stressed';
    const overallConfidence = (facialResult.confidence + wearableResult.confidence) / 2;

    return {
      facial: facialResult,
      wearable: wearableResult,
      combined_stress_level: combinedStressLevel,
      overall_confidence: overallConfidence,
    };
  } catch (error) {
    console.error('Error in combined stress analysis:', error);
    throw error;
  }
}
