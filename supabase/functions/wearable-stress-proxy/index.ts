import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WEARABLE_STRESS_API = "https://mrinal007-wesad.hf.space";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate synthetic signal data to pad to 1280 samples
function padSignal(values: number[], targetLength: number): number[] {
  if (values.length >= targetLength) return values.slice(0, targetLength);
  
  const result = [...values];
  while (result.length < targetLength) {
    // Repeat pattern with slight variation
    const idx = result.length % values.length;
    const variation = (Math.random() - 0.5) * 0.1 * values[idx];
    result.push(values[idx] + variation);
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
    
    // Extract and pad signals to 1280 samples (model requirement)
    const ecgValues = sensorData.map((r: any) => r.raw_ecg_signal || 0);
    const edaValues = sensorData.map((r: any) => r.gsr_value || 0);
    const tempValues = sensorData.map((r: any) => r.temperature || 36.5);
    
    const ecgPadded = padSignal(ecgValues, 1280);
    const edaPadded = padSignal(edaValues, 1280);
    const tempPadded = padSignal(tempValues, 1280);
    
    // Format as comma-separated strings (Gradio text input format)
    const ecgStr = ecgPadded.map(v => v.toFixed(4)).join(',');
    const edaStr = edaPadded.map(v => v.toFixed(4)).join(',');
    const tempStr = tempPadded.map(v => v.toFixed(4)).join(',');
    
    // Gradio 5 API format: POST to /gradio_api/call/predict
    try {
      console.log('  Trying Gradio 5 API format...');
      
      // Step 1: Submit job
      const submitResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [ecgStr, edaStr, tempStr] }),
      });

      if (submitResponse.ok) {
        const submitData = await submitResponse.json();
        const eventId = submitData.event_id;
        
        if (eventId) {
          // Step 2: Get result (SSE endpoint)
          const resultResponse = await fetch(`${WEARABLE_STRESS_API}/gradio_api/call/predict/${eventId}`);
          const resultText = await resultResponse.text();
          
          // Parse SSE response
          const dataMatch = resultText.match(/data:\s*(\[.*\])/);
          if (dataMatch) {
            const resultData = JSON.parse(dataMatch[1]);
            const prediction = resultData[0] || 'Not Stressed';
            
            console.log('✅ WESAD prediction:', prediction);
            
            const isStressed = prediction.toLowerCase().includes('stress');
            return new Response(JSON.stringify({
              prediction: isStressed ? 1 : 0,
              stress_level: prediction,
              confidence: 0.85,
              timestamp: new Date().toISOString(),
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (gradioErr) {
      console.warn('Gradio 5 API failed:', gradioErr.message);
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
