
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { 
        user_id, 
        heart_rate, 
        temperature, 
        ambient_temperature,
        gsr_value, 
        gsr_baseline,
        gsr_change,
        raw_ecg_signal,
        leads_off_detected,
        heart_rate_variability,
        arrhythmia_detected,
        device_status,
        timestamp 
      } = await req.json();

      console.log('Received enhanced sensor data:', { 
        user_id, 
        heart_rate, 
        temperature, 
        ambient_temperature,
        gsr_value, 
        gsr_baseline,
        gsr_change,
        raw_ecg_signal,
        leads_off_detected,
        heart_rate_variability,
        arrhythmia_detected,
        timestamp 
      });

      // Calculate stress score based on multiple factors
      let stressScore = 0;
      let stressLevel = 'low';
      
      if (heart_rate && gsr_value) {
        // Basic stress calculation using heart rate and GSR
        const hrFactor = heart_rate > 100 ? 0.4 : (heart_rate > 80 ? 0.2 : 0.1);
        const gsrFactor = gsr_change ? (gsr_change > 100 ? 0.5 : (gsr_change > 50 ? 0.3 : 0.1)) : 0.1;
        const tempFactor = temperature > 37.5 ? 0.1 : 0;
        
        stressScore = Math.min(100, Math.floor((hrFactor + gsrFactor + tempFactor) * 100));
        
        if (stressScore < 40) stressLevel = 'low';
        else if (stressScore < 70) stressLevel = 'moderate';
        else stressLevel = 'high';
      }

      // Insert into biometric_data_enhanced table
      const { data: biometricData, error: biometricError } = await supabaseClient
        .from('biometric_data_enhanced')
        .insert({
          user_id: user_id || 'cd85c225-fc57-4f51-be37-a9790faf0d3a', // Default user ID
          heart_rate: heart_rate ? parseInt(heart_rate) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          gsr_value: gsr_value ? parseFloat(gsr_value) : null,
          gsr_baseline: gsr_baseline ? parseInt(gsr_baseline) : null,
          gsr_change: gsr_change ? parseInt(gsr_change) : null,
          raw_ecg_signal: raw_ecg_signal ? parseInt(raw_ecg_signal) : null,
          leads_off_detected: leads_off_detected || false,
          heart_rate_variability: heart_rate_variability ? parseFloat(heart_rate_variability) : null,
          arrhythmia_detected: arrhythmia_detected || false,
          device_status: device_status || null,
          timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
          stress_level: stressLevel,
          stress_score: stressScore
        })
        .select()
        .single();

      if (biometricError) {
        console.error('Error inserting biometric data:', biometricError);
        return new Response(JSON.stringify({ error: biometricError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Enhanced data inserted successfully:', biometricData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Enhanced sensor data received successfully',
          data: biometricData,
          calculated_stress: {
            score: stressScore,
            level: stressLevel
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
