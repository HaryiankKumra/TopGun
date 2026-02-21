import React, { useRef, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Loader2,
  AlertTriangle,
  AudioWaveform,
  Brain,
  Activity,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface SpeechStressResult {
  emotion: string;
  stressScore: number;   // 0–1
  confidence: number;    // 0–1 (voiced speech ratio)
  warning?: string;
}

interface SpeechStressDetectorProps {
  faceStressScore: number;
  onSpeechResult?: (result: SpeechStressResult) => void;
  onFusionScore?: (score: number) => void;
  triggerRecording?: boolean;
}

const RECORDING_SECONDS = 10;
const FRAME_SIZE = 1024;

// Acoustic feature extraction from raw PCM.
// RMS energy → vocal loudness/arousal.
// Zero Crossing Rate (ZCR) → vocal tension / high-frequency content.
// Voiced ratio → fraction of frames above silence threshold.
function extractFeatures(pcm: Float32Array): { avgRms: number; avgZcr: number; voicedRatio: number } {
  const SILENCE_THR = 0.008;
  const numFrames = Math.floor(pcm.length / FRAME_SIZE);
  if (numFrames === 0) return { avgRms: 0, avgZcr: 0, voicedRatio: 0 };

  let sumRms = 0, sumZcr = 0, voiced = 0;
  for (let f = 0; f < numFrames; f++) {
    const s = f * FRAME_SIZE, e = s + FRAME_SIZE;
    let sq = 0;
    for (let i = s; i < e; i++) sq += pcm[i] * pcm[i];
    const rms = Math.sqrt(sq / FRAME_SIZE);
    sumRms += rms;
    let zc = 0;
    for (let i = s + 1; i < e; i++) if ((pcm[i] >= 0) !== (pcm[i - 1] >= 0)) zc++;
    sumZcr += zc / FRAME_SIZE;
    if (rms > SILENCE_THR) voiced++;
  }
  return { avgRms: sumRms / numFrames, avgZcr: sumZcr / numFrames, voicedRatio: voiced / numFrames };
}

// Calibrated ceilings: RMS 0.18 = loud speech, ZCR 0.12 = high-tension voice.
function classifyStress(avgRms: number, avgZcr: number, voicedRatio: number): SpeechStressResult {
  if (voicedRatio < 0.15) {
    return { emotion: "silent", stressScore: 0.10, confidence: voicedRatio, warning: "Too little speech detected — please speak clearly for 10 seconds." };
  }
  const normRms = Math.min(avgRms / 0.18, 1);
  const normZcr = Math.min(avgZcr / 0.12, 1);
  const rawStress = 0.55 * normRms + 0.45 * normZcr;
  const hiE = normRms > 0.50, hiZ = normZcr > 0.50;
  let emotion: string, base: number;
  if      (hiE && hiZ)                         { emotion = "stressed"; base = 0.78; }
  else if (hiE && !hiZ)                        { emotion = "excited";  base = 0.42; }
  else if (!hiE && hiZ)                        { emotion = "anxious";  base = 0.60; }
  else if (normRms < 0.20 && normZcr < 0.25)  { emotion = "calm";     base = 0.08; }
  else                                         { emotion = "neutral";  base = 0.32; }
  return { emotion, stressScore: Math.min(base + 0.15 * rawStress, 0.97), confidence: Math.round(voicedRatio * 100) / 100 };
}

const SpeechStressDetector: React.FC<SpeechStressDetectorProps> = ({
  faceStressScore,
  onSpeechResult,
  onFusionScore,
  triggerRecording = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const [result, setResult]           = useState<SpeechStressResult | null>(null);
  const [fusionScore, setFusionScore] = useState<number | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStressColor = (p: number) => p < 30 ? "text-green-500" : p < 60 ? "text-yellow-500" : "text-red-500";

  const getScoreBadgeClass = (s: number) =>
    s < 0.30 ? "bg-green-100 text-green-800 border-green-200"
    : s < 0.60 ? "bg-yellow-100 text-yellow-800 border-yellow-200"
    : "bg-red-100 text-red-800 border-red-200";

  const getEmotionBadgeClass = (emotion: string) => {
    const map: Record<string, string> = {
      calm:    "bg-green-100 text-green-800 border-green-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
      excited: "bg-blue-100 text-blue-800 border-blue-200",
      anxious: "bg-yellow-100 text-yellow-800 border-yellow-200",
      stressed:"bg-red-100 text-red-800 border-red-200",
      silent:  "bg-gray-100 text-gray-500 border-gray-200",
    };
    return map[emotion.toLowerCase()] ?? map.neutral;
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const analyzeAudio = useCallback(async (blob: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const buf      = await blob.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded  = await audioCtx.decodeAudioData(buf);
      audioCtx.close();
      const pcm = decoded.getChannelData(0);
      const { avgRms, avgZcr, voicedRatio } = extractFeatures(pcm);
      console.log("Voice features:", { avgRms: avgRms.toFixed(4), avgZcr: avgZcr.toFixed(4), voicedRatio: voicedRatio.toFixed(2) });
      const sr = classifyStress(avgRms, avgZcr, voicedRatio);
      setResult(sr);
      onSpeechResult?.(sr);
      const s100   = Math.round(sr.stressScore * 100);
      const fusion = Math.round(0.6 * faceStressScore + 0.4 * s100);
      setFusionScore(fusion);
      onFusionScore?.(fusion);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast({ title: "Analysis Failed", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }, [faceStressScore, onSpeechResult, onFusionScore]);

  // ─── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    setError(null);
    setResult(null);
    setFusionScore(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch {
      setError("Microphone access denied.");
      return;
    }

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find(
      (t) => MediaRecorder.isTypeSupported(t)
    ) ?? "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      await analyzeAudio(blob);
    };

    recorder.start(300);
    setIsRecording(true);
    setCountdown(RECORDING_SECONDS);

    let remaining = RECORDING_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setCountdown(0);
  };

  // Auto-start audio recording when facial camera starts
  useEffect(() => {
    if (triggerRecording && !isRecording && !isAnalyzing) {
      startRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerRecording]);

  const speechS100 = result ? Math.round(result.stressScore * 100) : null;

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AudioWaveform className="w-5 h-5 text-sky-500" />
          Speech Stress Analysis
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Acoustic analysis · instant · no download required
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        <div className="flex flex-col items-center gap-3">
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                  <Mic className="w-8 h-8 text-red-500" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {countdown}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Recording… {countdown}s left</span>
              <Button size="sm" variant="destructive" onClick={stopRecording}>
                <MicOff className="w-4 h-4 mr-1" /> Stop Early
              </Button>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Analysing voice…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={startRecording}
                className="bg-sky-600 hover:bg-sky-700 text-white h-14 w-14 rounded-full p-0"
              >
                <Mic className="w-6 h-6" />
              </Button>
              <span className="text-xs text-gray-500">Tap to record {RECORDING_SECONDS}s of speech</span>
            </div>
          )}
        </div>

        {isRecording && (
          <Progress value={((RECORDING_SECONDS - countdown) / RECORDING_SECONDS) * 100} className="h-2" />
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result?.warning && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">{result.warning}</p>
          </div>
        )}

        {result && !isAnalyzing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Voice State</p>
                <Badge className={getEmotionBadgeClass(result.emotion)}>{cap(result.emotion)}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Speech Detected</p>
                <Badge variant="outline">{(result.confidence * 100).toFixed(0)}%</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Voice Stress</span>
                  <span className={getStressColor(speechS100 ?? 0)}>{speechS100}%</span>
                </div>
                <Progress value={speechS100 ?? 0} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Face Stress</span>
                  <span className={getStressColor(faceStressScore)}>{faceStressScore}%</span>
                </div>
                <Progress value={faceStressScore} className="h-2" />
              </div>
              {fusionScore !== null && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                      <Brain className="w-3 h-3" /> Multimodal Fusion
                    </span>
                    <span className={`font-bold ${getStressColor(fusionScore)}`}>{fusionScore}%</span>
                  </div>
                  <Progress value={fusionScore} className="h-3" />
                  <p className="text-xs text-gray-400 mt-1 text-center">0.6 × face + 0.4 × voice</p>
                </div>
              )}
            </div>

            {fusionScore !== null && (
              <div className="text-center">
                <Badge className={getScoreBadgeClass(fusionScore / 100)}>
                  {fusionScore < 30 ? "Low Stress" : fusionScore < 60 ? "Moderate Stress" : "High Stress"}
                </Badge>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Analyses RMS energy · zero-crossing rate · voiced ratio
        </p>
      </CardContent>
    </Card>
  );
};

export default SpeechStressDetector;
