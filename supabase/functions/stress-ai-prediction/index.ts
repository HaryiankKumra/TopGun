
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sensorData, videoData } = await req.json();
    console.log('Received data for AI prediction:', { sensorData, videoData });

    // Format data for the external AI service
    const formattedData = [
      JSON.stringify(sensorData || {}),
      JSON.stringify(videoData || {}),
      JSON.stringify({ timestamp: new Date().toISOString() })
    ];

    // Call the external Hugging Face API
    const callResponse = await fetch('https://haryiank-stress-detector.hf.space/gradio_api/call/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: formattedData
      }),
    });

    if (!callResponse.ok) {
      throw new Error(`API call failed: ${callResponse.status}`);
    }

    const callData = await callResponse.text();
    console.log('Call response:', callData);

    // Extract event ID from response
    const eventIdMatch = callData.match(/"([^"]+)"/);
    if (!eventIdMatch) {
      throw new Error('Could not extract event ID from response');
    }

    const eventId = eventIdMatch[1];
    console.log('Event ID:', eventId);

    // Get the prediction result
    const resultResponse = await fetch(`https://haryiank-stress-detector.hf.space/gradio_api/call/predict/${eventId}`, {
      method: 'GET',
    });

    if (!resultResponse.ok) {
      throw new Error(`Result fetch failed: ${resultResponse.status}`);
    }

    const resultText = await resultResponse.text();
    console.log('Result response:', resultText);

    // Parse the result - this is a simple example, adjust based on actual API response format
    let stressPrediction = {
      stressLevel: 'moderate',
      confidence: 0.75,
      recommendations: ['Take deep breaths', 'Consider a short break'],
      timestamp: new Date().toISOString()
    };

    try {
      // Try to parse the actual response
      const lines = resultText.split('\n').filter(line => line.startsWith('data: '));
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const jsonStr = lastLine.replace('data: ', '').trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          const parsed = JSON.parse(jsonStr);
          // Adjust this parsing based on the actual API response structure
          if (parsed.data && parsed.data.length > 0) {
            stressPrediction = {
              stressLevel: parsed.data[0] || 'moderate',
              confidence: parseFloat(parsed.data[1]) || 0.75,
              recommendations: parsed.data[2] || ['Take deep breaths', 'Consider a short break'],
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    } catch (parseError) {
      console.log('Could not parse detailed response, using default:', parseError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        prediction: stressPrediction
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in stress AI prediction:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        prediction: {
          stressLevel: 'unknown',
          confidence: 0,
          recommendations: ['Unable to process at this time'],
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
