
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a stress management chatbot named StressGuard. Your role is to explain to users why their stress score might be high, based on their physiological data (heart rate, temperature, EDA, stress score) and medical history (hypertension, diabetes, anxiety history). Your explanation should be short, friendly, and reassuring, helping them understand if the stress score is due to physical conditions or mental stress. Suggest simple actions if needed, but avoid alarming language. Always speak directly to the user with empathy and calmness.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientHistory, vitals, predictedStressLevel } = await req.json();
    console.log('📊 Generating AI explanation for vitals:', vitals);

    if (!openAIApiKey) {
      console.log('⚠️ No OpenAI API key found');
      return new Response(JSON.stringify({ 
        explanation: "Based on your current readings, your stress levels appear elevated. This could be due to various factors including physical activity, environmental conditions, or emotional state. Consider taking a few deep breaths and try some relaxation techniques." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Structure the prompt with patient data
    const structuredPrompt = `
Patient Data:
- Hypertension: ${patientHistory?.medical_conditions?.includes('hypertension') ? 'Yes' : 'No'}
- Diabetes: ${patientHistory?.medical_conditions?.includes('diabetes') ? 'Yes' : 'No'}
- Anxiety History: ${patientHistory?.medical_conditions?.includes('anxiety') ? 'Yes' : 'No'}
- Age: ${patientHistory?.age || 'Not specified'}
- Activity Level: ${patientHistory?.activity_level || 'Not specified'}

Current Vitals:
- Heart Rate: ${vitals.heart_rate || 'N/A'} BPM
- Temperature: ${vitals.temperature || 'N/A'}°F
- EDA: ${vitals.gsr_value || 'N/A'}Ω
- Stress Score: ${vitals.stress_score || 'N/A'}%

Predicted Stress Level: ${predictedStressLevel}

Please explain to the user why their stress score might be high based on this data, and whether it may be due to physical conditions instead of mental stress, in under 80 words.`;

    console.log('🤖 Calling OpenAI API with structured prompt...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: structuredPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI');
    }

    const explanation = data.choices[0].message.content.trim();
    console.log('📤 Sending explanation back to client');

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in ai-stress-explanation function:', error);
    return new Response(JSON.stringify({ 
      explanation: "I'm here to help you understand your stress levels. Based on your current readings, consider taking some deep breaths and engaging in relaxation activities. If you're concerned about persistent high stress levels, please consult with a healthcare professional." 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
