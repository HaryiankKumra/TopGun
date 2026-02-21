import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Updated to use your Hugging Face Space: Haryiank/stress-detector
const WEARABLE_STRESS_API = "https://Haryiank-stress-detector.hf.space";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Format signals according to your API requirements:
// ECG: 700 samples, comma-separated
// EDA: 20 samples, comma-separated
// TEMP: 20 samples, comma-separated
function formatSignal(values: number[], targetLength: number): number[] {
  if (values.length >= targetLength) {
    return values.slice(0, targetLength);
  }
  
  // If we have fewer samples, interpolate/pad to target length
  const result = [...values];
  if (values.length > 0) {
    const lastValue = values[values.length - 1];
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    while (result.length < targetLength) {
      // Use average with slight variation for padding
      const variation = (Math.random() - 0.5) * 0.05 * avgValue;
      result.push(avgValue + variation);
    }
  } else {
    // If no data, pad with zeros
    while (result.length < targetLength) {
      result.push(0);
    }
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⌚ Wearable stress analysis request received');
    
    const { sensorData } = await req.json();
    
    if (!sensorData || sensorData.length < 5) {
      throw new Error('Insufficient sensor data. Need at least 5 readings.');
    }

    console.log(`🔄 Calling Hugging Face API: ${WEARABLE_STRESS_API}`);
    console.log(`   Sensor readings: ${sensorData.length}`);
    
    // Extract signals from sensor data
    const ecgValues = sensorData.map((r: any) => r.raw_ecg_signal || 0);
    const edaValues = sensorData.map((r: any) => r.gsr_value || 0);
    const tempValues = sensorData.map((r: any) => r.temperature || 36.5);
    
    // Format signals according to your API requirements:
    // ECG: 700 samples, EDA: 20 samples, TEMP: 20 samples
    const ecgFormatted = formatSignal(ecgValues, 700);
    const edaFormatted = formatSignal(edaValues, 20);
    const tempFormatted = formatSignal(tempValues, 20);
    
    // Format as comma-separated strings (Gradio text input format)
    const ecgStr = ecgFormatted.map(v => v.toString()).join(',');
    const edaStr = edaFormatted.map(v => v.toString()).join(',');
    const tempStr = tempFormatted.map(v => v.toString()).join(',');
    
    console.log(`   ECG samples: ${ecgFormatted.length}, EDA samples: ${edaFormatted.length}, TEMP samples: ${tempFormatted.length}`);
    
    // Use Gradio API format: POST to /gradio_api/call/predict (async pattern)
    // This is the correct format for Gradio Spaces
    try {
      console.log('  Calling Gradio API: /gradio_api/call/predict');
      
      // Step 1: Submit prediction request
      const submitResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [ecgStr, edaStr, tempStr]
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`API submit error: ${submitResponse.status} - ${errorText}`);
      }

      const submitResult = await submitResponse.json();
      const eventId = submitResult.event_id;
      
      if (!eventId) {
        throw new Error('No event_id received from API');
      }

      console.log(`  Event ID received: ${eventId}`);
      console.log('  Polling for result...');

      // Step 2: Poll for result (Gradio async pattern)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
        
        const resultResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict/${eventId}`);
        const resultText = await resultResponse.text();
        
        // Parse SSE response format: "data: [result]"
        const dataMatch = resultText.match(/data:\s*(\[.*\])/);
        if (dataMatch) {
          const resultData = JSON.parse(dataMatch[1]);
          const prediction = resultData[0] || '';
          
          console.log('✅ Hugging Face API prediction received:', prediction);
          
          // Parse prediction format: "Non-Stress (Confidence: 0.00)" or "Stressed (Confidence: 0.95)"
          let isStressed = false;
          let confidence = 0.85;
          
          // Extract confidence from prediction string if available
          const confidenceMatch = prediction.match(/Confidence:\s*([\d.]+)/);
          if (confidenceMatch) {
            confidence = parseFloat(confidenceMatch[1]);
          }
          
          // Determine if stressed (check for "Stressed" but not "Non-Stress")
          isStressed = prediction.toLowerCase().includes('stressed') && 
                       !prediction.toLowerCase().includes('non-stress') &&
                       !prediction.toLowerCase().includes('not stressed');
          
          return new Response(JSON.stringify({
            prediction: isStressed ? 1 : 0,
            stress_level: isStressed ? 'Stressed' : 'Not Stressed',
            raw_output: prediction,
            confidence: confidence,
            timestamp: new Date().toISOString(),
            method: 'huggingface_api',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Check if complete (JSON format)
        if (resultText.includes('"status":"COMPLETE"')) {
          try {
            const jsonResult = JSON.parse(resultText);
            if (jsonResult.data && jsonResult.data.length > 0) {
              const prediction = jsonResult.data[0] || '';
              
              // Extract confidence from prediction string
              let confidence = 0.85;
              const confidenceMatch = prediction.match(/Confidence:\s*([\d.]+)/);
              if (confidenceMatch) {
                confidence = parseFloat(confidenceMatch[1]);
              }
              
              const isStressed = prediction.toLowerCase().includes('stressed') && 
                               !prediction.toLowerCase().includes('non-stress') &&
                               !prediction.toLowerCase().includes('not stressed');
              
              return new Response(JSON.stringify({
                prediction: isStressed ? 1 : 0,
                stress_level: isStressed ? 'Stressed' : 'Not Stressed',
                raw_output: prediction,
                confidence: confidence,
                timestamp: new Date().toISOString(),
                method: 'huggingface_api',
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
          } catch (e) {
            // Continue polling
          }
        }
      }
      
      throw new Error('Timeout waiting for API result');
    } catch (apiErr) {
      console.warn('Gradio API failed:', apiErr.message);
      // Fall through to fallback instead of re-throwing
    }
    
    // Fallback: Use simple heuristic-based stress detection
    console.log('⚠️ Using local heuristic fallback');
    
    const avgEcg = ecgValues.reduce((a: number, b: number) => a + b, 0) / ecgValues.length;
    const avgEda = edaValues.reduce((a: number, b: number) => a + b, 0) / edaValues.length;
    const avgTemp = tempValues.reduce((a: number, b: number) => a + b, 0) / tempValues.length;
    
    // Simple heuristic: high EDA or high ECG variance = stress
    let stressScore = 0;
    if (avgEda > 400) stressScore += 30;
    if (avgEda > 600) stressScore += 20;
    if (avgTemp > 37.5) stressScore += 20;
    if (avgEcg > 0.8) stressScore += 30;
    
    const isStressed = stressScore >= 50;
    
    return new Response(JSON.stringify({
      prediction: isStressed ? 1 : 0,
      stress_level: isStressed ? 'Stressed' : 'Not Stressed',
      confidence: 0.7,
      timestamp: new Date().toISOString(),
      method: 'heuristic',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Wearable stress analysis error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      prediction: 0,
      stress_level: 'Not Stressed',
      confidence: 0.5,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
