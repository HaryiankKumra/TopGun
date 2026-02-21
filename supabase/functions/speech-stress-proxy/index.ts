import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Models to try in order ───────────────────────────────────────────────────
// 1. ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition
//    Labels: angry, disgust, fear, happy, neutral, ps (pleased-surprised), sad
// 2. speechbrain/emotion-recognition-wav2vec2-IEMOCAP
//    Labels: neu, hap, ang, sad
const HF_MODELS = [
  "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition",
  "speechbrain/emotion-recognition-wav2vec2-IEMOCAP",
];

// ─── Emotion → stress score mapping ──────────────────────────────────────────
const EMOTION_STRESS_MAP: Record<string, { label: string; score: number }> = {
  // ehcalabres model labels
  angry:    { label: "angry",    score: 0.85 },
  disgust:  { label: "disgusted",score: 0.75 },
  fear:     { label: "fearful",  score: 0.90 },
  happy:    { label: "happy",    score: 0.15 },
  neutral:  { label: "neutral",  score: 0.40 },
  ps:       { label: "surprised",score: 0.50 }, // pleased-surprised
  sad:      { label: "sad",      score: 0.65 },
  // speechbrain IEMOCAP labels
  ang:      { label: "angry",    score: 0.85 },
  hap:      { label: "happy",    score: 0.15 },
  neu:      { label: "neutral",  score: 0.40 },
  // generic fallbacks
  fearful:  { label: "fearful",  score: 0.90 },
  disgusted:{ label: "disgusted",score: 0.75 },
  surprised:{ label: "surprised",score: 0.50 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🎤 Speech stress analysis request received");

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "No audio file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔊 Audio received – size: ${audioFile.size} bytes, type: ${audioFile.type}`);

    const HF_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!HF_API_KEY) {
      console.error("❌ HUGGINGFACE_API_KEY secret not set");
      return new Response(
        JSON.stringify({ error: "HuggingFace API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();

    // ─── Try each model in order ──────────────────────────────────────────────
    let predictions: Array<{ label: string; score: number }> | null = null;
    let usedModel = "";
    const trialErrors: string[] = [];

    for (const model of HF_MODELS) {
      console.log(`📡 Trying model: ${model}`);
      try {
        const res = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${HF_API_KEY}`,
              "Content-Type": audioFile.type || "audio/webm",
            },
            body: audioBuffer,
          }
        );

        const body = await res.text();
        console.log(`  → status ${res.status}, body: ${body.slice(0, 200)}`);

        if (!res.ok) {
          trialErrors.push(`${model}: HTTP ${res.status} – ${body.slice(0, 120)}`);

          // 503 = model loading – wait briefly then one retry
          if (res.status === 503) {
            console.log("  → Model loading, waiting 8s before retry…");
            await new Promise((r) => setTimeout(r, 8000));
            const retry = await fetch(
              `https://api-inference.huggingface.co/models/${model}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${HF_API_KEY}`,
                  "Content-Type": audioFile.type || "audio/webm",
                },
                body: audioBuffer,
              }
            );
            if (retry.ok) {
              predictions = await retry.json();
              usedModel = model;
              break;
            }
          }
          continue;
        }

        const parsed = JSON.parse(body);

        // Both models return Array<{label, score}>
        if (Array.isArray(parsed) && parsed.length > 0) {
          predictions = parsed;
          usedModel = model;
          break;
        }

        trialErrors.push(`${model}: unexpected response shape`);
      } catch (fetchErr) {
        trialErrors.push(`${model}: ${String(fetchErr)}`);
      }
    }

    if (!predictions || predictions.length === 0) {
      console.error("❌ All models failed:", trialErrors);
      return new Response(
        JSON.stringify({
          error: "All speech emotion models unavailable",
          details: trialErrors,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Predictions from ${usedModel}:`, JSON.stringify(predictions));

    // ─── Map top prediction to stress score ───────────────────────────────────
    const top = predictions[0];
    const labelKey = top.label.toLowerCase();
    const mapped = EMOTION_STRESS_MAP[labelKey] ?? { label: labelKey, score: 0.40 };

    const result = {
      emotion:     mapped.label,
      stressScore: mapped.score,
      confidence:  Math.round(top.score * 100) / 100,
      model:       usedModel,
      allPredictions: predictions.map((p) => ({
        label: EMOTION_STRESS_MAP[p.label.toLowerCase()]?.label ?? p.label,
        score: Math.round(p.score * 100) / 100,
      })),
    };

    console.log("📊 Speech stress result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
