import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FACIAL_STRESS_API = "https://haryiank-facial-stress.hf.space";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📸 Facial stress analysis request received');
    
    const formData = await req.formData();
    const imageFile = formData.get('image');
    
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    console.log(`🔄 Processing image for Hugging Face API: ${FACIAL_STRESS_API}`);
    
    // Convert image to base64 for Gradio API
    const buffer = await (imageFile as Blob).arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(buffer))
    );
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('📦 Image converted to base64, size:', base64Image.length, 'chars');
    
    // Try multiple Gradio endpoint patterns
    const endpoints = [
      { path: '/api/predict', method: 'POST', body: { data: [dataUrl] } },
      { path: '/run/predict', method: 'POST', body: { data: [dataUrl] } },
      { path: '/api', method: 'POST', body: { data: [dataUrl] } },
    ];
    
    let lastError;
    for (const endpoint of endpoints) {
      try {
        console.log(`  Trying endpoint: ${endpoint.path}`);
        
        const response = await fetch(`${FACIAL_STRESS_API}${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(endpoint.body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Facial stress analysis successful, raw response:', data);
          
          // Parse Gradio response format
          let result;
          if (data.data && Array.isArray(data.data)) {
            // Gradio typically returns { data: [{ label: "emotion", confidence: 0.95 }] }
            const prediction = data.data[0];
            result = {
              emotion: prediction.label || prediction.emotion || 'neutral',
              stress_level: prediction.stress || (prediction.label?.toLowerCase().includes('stress') ? 'Stressed' : 'Not Stressed'),
              confidence: prediction.confidence || prediction.score || 0.85,
              timestamp: new Date().toISOString(),
            };
          } else {
            // Direct response format
            result = {
              emotion: data.emotion || data.label || 'neutral',
              stress_level: data.stress_level || (data.prediction === 1 ? 'Stressed' : 'Not Stressed'),
              confidence: data.confidence || data.score || 0.85,
              timestamp: new Date().toISOString(),
            };
          }
          
          console.log('✅ Parsed result:', result);
          
          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        lastError = `HTTP ${response.status}: ${await response.text()}`;
      } catch (err) {
        lastError = err.message;
        console.warn(`  Endpoint ${endpoint.path} failed:`, err.message);
        continue;
      }
    }
    
    // If all endpoints failed, return fallback
    console.warn('⚠️ All Hugging Face endpoints failed, using fallback');
    console.error('Last error:', lastError);
    
    return new Response(JSON.stringify({
      emotion: 'neutral',
      stress_level: 'Not Stressed',
      confidence: 0.5,
      timestamp: new Date().toISOString(),
      warning: 'Using fallback analysis. Hugging Face Space may be sleeping or unavailable.',
      error: lastError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Still return 200 to prevent app crash
    });
    
  } catch (error) {
    console.error('❌ Facial stress analysis error:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      emotion: 'neutral',
      stress_level: 'Not Stressed',
      confidence: 0.5,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 with fallback to prevent app crash
    });
  }
});
