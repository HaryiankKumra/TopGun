
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Smart keyword-based responses for when API is unavailable
const stressResponses: Record<string, string[]> = {
  anxiety: [
    "I hear you're feeling anxious. Here's a quick grounding technique:\n\n**5-4-3-2-1 Method:**\n• 5 things you can see\n• 4 things you can touch\n• 3 things you can hear\n• 2 things you can smell\n• 1 thing you can taste\n\nThis helps bring you back to the present moment. Would you like more anxiety management tips?",
    "Anxiety can feel overwhelming, but there are tools to help:\n\n**Box Breathing:**\n• Inhale 4 seconds\n• Hold 4 seconds\n• Exhale 4 seconds\n• Hold 4 seconds\n\nRepeat 4 times. This activates your parasympathetic nervous system. What's causing your anxiety today?"
  ],
  sleep: [
    "Sleep issues can really impact stress levels. Try this tonight:\n\n**Sleep Hygiene Tips:**\n• No screens 1 hour before bed\n• Keep your room cool (65-68°F)\n• Try the 4-7-8 breathing technique\n• Write down worries before bed to 'park' them\n• Consistent sleep/wake times\n\nWould you like a guided relaxation script for bedtime?",
    "Having trouble sleeping? Here's a body scan technique:\n\n1. Lie comfortably in bed\n2. Starting from your toes, notice each body part\n3. Consciously relax each area\n4. Move slowly up to your head\n5. Focus on your breath\n\nThis usually takes 10-15 minutes and helps your body prepare for sleep."
  ],
  work: [
    "Work stress is very common. Here are some strategies:\n\n**Immediate Relief:**\n• Take a 5-minute walk\n• Do desk stretches\n• Practice 3 deep breaths\n\n**Long-term:**\n• Set boundaries with work hours\n• Prioritize tasks (Eisenhower matrix)\n• Take regular breaks (Pomodoro technique)\n• Communicate workload concerns\n\nWhat aspect of work is most stressful right now?",
    "Feeling overwhelmed at work? Try the **2-minute rule**: If something takes less than 2 minutes, do it now.\n\nAlso, try **task batching** - group similar tasks together to reduce mental switching.\n\nRemember: You can't pour from an empty cup. What would help you feel more in control?"
  ],
  breathing: [
    "Great that you're interested in breathing exercises! Here are my top 3:\n\n**1. Box Breathing (4-4-4-4)**\nInhale 4s → Hold 4s → Exhale 4s → Hold 4s\n\n**2. 4-7-8 Breathing**\nInhale 4s → Hold 7s → Exhale 8s\n\n**3. Physiological Sigh**\nDouble inhale through nose → Long exhale through mouth\n\nWhich one would you like to try?",
  ],
  meditation: [
    "Meditation is excellent for stress! Here's a simple 5-minute practice:\n\n1. Sit comfortably, close your eyes\n2. Focus on your breath\n3. When thoughts arise, acknowledge them and return to breath\n4. Don't judge yourself for having thoughts\n5. Start with 5 minutes, gradually increase\n\n**Apps I recommend:** Headspace, Calm, Insight Timer\n\nHave you tried meditation before?"
  ],
  angry: [
    "Anger is a valid emotion. Here's how to manage it constructively:\n\n**In the moment:**\n• STOP - don't react immediately\n• Take 10 deep breaths\n• Remove yourself if possible\n• Count backwards from 10\n\n**Later:**\n• Exercise to release tension\n• Write about what triggered you\n• Identify the underlying need\n\nWhat triggered your anger?"
  ],
  sad: [
    "I'm sorry you're feeling sad. It's okay to feel this way. Here's what might help:\n\n**Gentle self-care:**\n• Allow yourself to feel without judgment\n• Reach out to someone you trust\n• Do something small that brings comfort\n• Go outside for fresh air and sunlight\n• Practice self-compassion\n\nRemember, emotions are temporary. Would you like to talk about what's making you sad?"
  ],
  panic: [
    "If you're having a panic attack, try this:\n\n**TIPP Technique:**\n• **T**emperature - Hold ice or splash cold water on face\n• **I**ntense exercise - 30 seconds of jumping jacks\n• **P**aced breathing - Slow, deep breaths\n• **P**aired muscle relaxation - Tense then release\n\n**Remember:** Panic attacks are scary but not dangerous. They pass. You've survived every one before.\n\nAre you feeling a panic attack right now?"
  ],
  relationship: [
    "Relationship stress can be challenging. Here are some communication tips:\n\n**I-Statements:** Instead of 'You make me...', try 'I feel... when...'\n\n**Active Listening:** Repeat back what you heard to ensure understanding\n\n**Take breaks:** If discussion gets heated, take 20 minutes apart\n\n**Focus on solutions:** Not who's right or wrong\n\nWhat relationship situation is causing you stress?"
  ],
  default: [
    "I'm here to support your mental wellness journey. Here are some techniques I can help with:\n\n🌬️ **Breathing Exercises** - Calm your nervous system\n🧘 **Meditation** - Find inner peace\n😴 **Sleep Tips** - Rest better\n💼 **Work Stress** - Manage professional pressures\n😟 **Anxiety Relief** - Ground yourself\n😢 **Emotional Support** - Process difficult feelings\n\nWhat would you like to explore?",
    "Thanks for reaching out! Here are some quick stress relief techniques:\n\n**Physical:**\n• Deep breathing\n• Progressive muscle relaxation\n• Light stretching or walking\n\n**Mental:**\n• Journaling\n• Gratitude practice\n• Mindfulness meditation\n\n**Connection:**\n• Talking to someone you trust\n• Spending time with pets\n• Acts of kindness\n\nWhat type of stress are you experiencing?"
  ]
};

function getKeywordResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  const keywords: [string, string[]][] = [
    ['anxiety|anxious|worried|worry|nervous|panic', stressResponses.anxiety],
    ['sleep|insomnia|tired|fatigue|exhausted|rest', stressResponses.sleep],
    ['work|job|boss|deadline|workload|office|career', stressResponses.work],
    ['breath|breathing|inhale|exhale', stressResponses.breathing],
    ['meditat|mindful|calm|relax|peace', stressResponses.meditation],
    ['angry|anger|mad|furious|frustrated|rage', stressResponses.angry],
    ['sad|depressed|down|unhappy|crying|tears', stressResponses.sad],
    ['panic|attack|can\'t breathe|heart racing', stressResponses.panic],
    ['relationship|partner|spouse|family|friend|conflict', stressResponses.relationship],
  ];
  
  for (const [pattern, responses] of keywords) {
    if (new RegExp(pattern).test(lowerMessage)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  
  return stressResponses.default[Math.floor(Math.random() * stressResponses.default.length)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, healthContext } = await req.json();
    console.log('📨 Received message:', message);
    console.log('📊 Health context provided:', healthContext ? 'Yes' : 'No');

    // Try Gemini API first
    if (geminiApiKey) {
      try {
        console.log('🤖 Calling Gemini API...');
        
        // Build health context section if available
        let healthSection = '';
        if (healthContext) {
          healthSection = `
USER'S CURRENT HEALTH DATA (use this to provide personalized advice):
- Heart Rate: ${healthContext.heartRate || 'N/A'} BPM
- Stress Score: ${healthContext.stressScore || 'N/A'}%
- Facial Emotion: ${healthContext.facialEmotion || 'N/A'} (${healthContext.facialConfidence || 'N/A'}% confidence)
- Wearable Stress: ${healthContext.wearableStress || 'N/A'}%
- Fusion Stress: ${healthContext.fusionStress || 'N/A'}%
- Temperature: ${healthContext.temperature || 'N/A'}°C
- SpO2: ${healthContext.spo2 || 'N/A'}%
- EDA/GSR: ${healthContext.eda || 'N/A'}
- Health Conditions: ${healthContext.healthConditions || 'None specified'}
- Medications: ${healthContext.medications || 'None specified'}
- Recent Trend: ${healthContext.recentTrend || 'Unknown'}

Based on this data, provide relevant health insights and personalized stress management advice.
`;
        }
        
        const systemPrompt = `You are a compassionate AI health assistant specialized in stress management and wellness. You have access to the user's real-time biometric data from wearable sensors and facial emotion detection.

${healthSection}

GUIDELINES:
- Analyze the user's health metrics to provide personalized advice
- If stress levels are high, suggest immediate coping techniques
- Reference their specific numbers when relevant (e.g., "I see your heart rate is elevated at X BPM")
- Consider their facial emotion state in your responses
- Be empathetic, supportive, and actionable
- Keep responses concise but helpful (under 250 words)
- If health data shows concerning patterns, gently recommend consulting a healthcare professional`;

        // Use the latest Gemini 3 Flash Preview model
        console.log('🤖 Calling Gemini 3 Flash Preview...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + "\n\nUser: " + message }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiResponse) {
            console.log('✅ Gemini 3 Flash Preview response received');
            return new Response(JSON.stringify({ response: aiResponse }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        console.warn(`⚠️ Gemini API failed (${response.status}), using smart fallback`);
      } catch (e) {
        console.warn('⚠️ Gemini error:', e.message);
      }
    }

    // Smart keyword-based fallback
    console.log('💡 Using smart keyword-based response');
    const smartResponse = getKeywordResponse(message);
    
    return new Response(JSON.stringify({ response: smartResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      response: getKeywordResponse('help') 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
