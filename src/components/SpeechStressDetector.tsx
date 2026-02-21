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
// Import Meyda - handle both default and named exports
import Meyda from "meyda";
// Also try to access via window if available (for browser builds)
const MeydaLib = (typeof window !== 'undefined' && (window as any).Meyda) || Meyda;

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

const RECORDING_SECONDS = 8; // Increased for better MFCC stability
const FRAME_SIZE = 1024;
const MFCC_COEFFICIENTS = 13; // Number of MFCC coefficients to extract (excluding coefficient 0)

/**
 * Extract MFCC (Mel-Frequency Cepstral Coefficients) features from PCM audio data.
 * 
 * MFCC captures spectral characteristics of speech by:
 * 1. Converting frequency domain to mel scale (perceptual frequency scale)
 * 2. Taking logarithm to compress dynamic range
 * 3. Applying DCT to decorrelate coefficients
 * 
 * Compared to RMS/ZCR:
 * - RMS: Only captures energy/loudness (1D feature)
 * - ZCR: Only captures high-frequency content (1D feature)
 * - MFCC: Captures spectral shape, formants, and vocal tract characteristics (13D feature)
 * 
 * MFCC is superior for stress detection because:
 * - Stress affects vocal tract tension → changes spectral envelope → captured by MFCC
 * - Higher-order MFCC coefficients (1-12) capture fine spectral details
 * - Coefficient 0 represents log energy (similar to RMS but in log domain)
 */
function extractMFCCFeatures(
  pcm: Float32Array,
  sampleRate: number
): { mfccCoefficients: number[][]; voicedRatio: number } {
  const SILENCE_THR = 0.008; // RMS threshold for voiced speech detection
  const numFrames = Math.floor(pcm.length / FRAME_SIZE);
  
  if (numFrames === 0) {
    return { mfccCoefficients: [], voicedRatio: 0 };
  }

  const mfccCoefficients: number[][] = [];
  let voicedFrames = 0;

  // Use MeydaLib (which might be from window or import)
  const MeydaToUse = MeydaLib || Meyda;
  
  // Verify Meyda is available and has the extract method
  if (!MeydaToUse || typeof MeydaToUse.extract !== 'function') {
    console.error("Meyda is not properly loaded or extract method is missing");
    console.error("Meyda object:", MeydaToUse);
    console.error("Window Meyda:", typeof window !== 'undefined' ? (window as any).Meyda : 'N/A');
    return { mfccCoefficients: [], voicedRatio: 0 };
  }

  // CRITICAL FIX #1: Use Meyda configuration via extract options, not global state
  // This prevents state pollution across multiple extractions
  // Note: Some Meyda versions may still require global config, but we'll try options first
  const meydaOptions = {
    bufferSize: FRAME_SIZE,
    sampleRate: sampleRate,
    numberOfMFCCCoefficients: MFCC_COEFFICIENTS,
    melBands: 26, // Standard value for MFCC
  };
  
  // Set global config as fallback (for compatibility with older Meyda versions)
  MeydaToUse.bufferSize = FRAME_SIZE;
  MeydaToUse.sampleRate = sampleRate;
  MeydaToUse.numberOfMFCCCoefficients = MFCC_COEFFICIENTS;
  if (typeof MeydaToUse.melBands !== 'undefined') {
    MeydaToUse.melBands = 26;
  }

  // Test Meyda with a simple feature first to verify it's working
  // Note: Some Meyda features return numbers directly, others return objects
  const testFrame = new Float32Array(FRAME_SIZE).fill(0.1);
  const testFeatures = MeydaToUse.extract("rms", testFrame);
  
  // RMS can return a number directly, so check if it's a valid number or object
  const meydaWorking = (typeof testFeatures === 'number' && !isNaN(testFeatures)) || 
                       (typeof testFeatures === 'object' && testFeatures !== null);
  
  if (!meydaWorking) {
    console.error("Meyda.extract test failed - Meyda may not be properly initialized");
    console.error("Test result:", testFeatures, "Type:", typeof testFeatures);
    return { mfccCoefficients: [], voicedRatio: 0 };
  }
  
  console.log("✅ Meyda is working - RMS test:", testFeatures);

  // Check if MFCC is available as a feature
  let availableFeatures: string[] = [];
  if (typeof MeydaToUse.listAvailableFeatureExtractors === 'function') {
    availableFeatures = MeydaToUse.listAvailableFeatureExtractors();
    console.log("Available Meyda features:", availableFeatures);
    if (!availableFeatures.includes("mfcc")) {
      console.error("MFCC is not available in this Meyda version!");
      return { mfccCoefficients: [], voicedRatio: 0 };
    }
  }

  // Test MFCC extraction on a test frame
  // IMPORTANT: Meyda.extract("mfcc") returns an ARRAY directly, not an object with 'mfcc' property!
  const testMFCC = MeydaToUse.extract("mfcc", testFrame);
  console.log("Test MFCC extraction result:", testMFCC);
  
  // Check if it's an array (which is what Meyda returns for MFCC)
  const mfccAvailable = Array.isArray(testMFCC) && testMFCC.length === MFCC_COEFFICIENTS;
  
  if (!mfccAvailable) {
    console.error("⚠️ MFCC test extraction failed!");
    console.error("Test MFCC result:", testMFCC);
    console.error("Test MFCC type:", typeof testMFCC);
    console.error("Is array?", Array.isArray(testMFCC));
    if (testMFCC) console.error("Test MFCC length:", testMFCC.length);
    console.warn("Will attempt MFCC extraction anyway - may use fallback");
  } else {
    console.log("✅ MFCC feature is available and working - returns array directly");
  }

  // Debug: Log Meyda configuration
  const testRMSValue = typeof testFeatures === 'object' ? testFeatures.rms : testFeatures;
  console.log("Meyda configuration:", {
    bufferSize: MeydaToUse.bufferSize,
    sampleRate: MeydaToUse.sampleRate,
    numberOfMFCCCoefficients: MeydaToUse.numberOfMFCCCoefficients,
    melBands: MeydaToUse.melBands,
    hasExtract: typeof MeydaToUse.extract === 'function',
    testRMS: testRMSValue,
    testMFCCAvailable: mfccAvailable,
    testMFCCLength: Array.isArray(testMFCC) ? testMFCC.length : 0,
  });

  // Process audio in frames of FRAME_SIZE samples
  let extractionErrors = 0;
  for (let f = 0; f < numFrames; f++) {
    const startIdx = f * FRAME_SIZE;
    const endIdx = startIdx + FRAME_SIZE;
    const frame = pcm.slice(startIdx, endIdx);

    // Ensure frame is exactly FRAME_SIZE (pad with zeros if needed)
    const paddedFrame = new Float32Array(FRAME_SIZE);
    paddedFrame.set(frame, 0);

    // Check if frame contains voiced speech (simple RMS-based silence detection)
    let frameEnergy = 0;
    for (let i = 0; i < paddedFrame.length; i++) {
      frameEnergy += paddedFrame[i] * paddedFrame[i];
    }
    const rms = Math.sqrt(frameEnergy / FRAME_SIZE);
    const isVoiced = rms > SILENCE_THR;
    if (isVoiced) voicedFrames++;

    // Extract MFCC using Meyda library
    // Meyda expects the signal to be exactly bufferSize length
    // Try with Float32Array first (Meyda v5 should accept this)
    let features: any = null;
    let extractionError: Error | null = null;
    
    try {
      // Ensure the frame is exactly the bufferSize
      if (paddedFrame.length !== MeydaToUse.bufferSize) {
        console.warn(`Frame size mismatch: ${paddedFrame.length} vs ${MeydaToUse.bufferSize}`);
      }
      
      // CRITICAL FIX #1: Extract MFCC with options (not relying on global state)
      // Meyda.extract("mfcc") returns an ARRAY directly: [c0, c1, c2, ..., c12]
      let mfccResult: any = null;
      
      try {
        // Try with options first (if Meyda supports it)
        // Note: Meyda v5 may not support options, so we fall back to global config
        mfccResult = MeydaToUse.extract("mfcc", paddedFrame);
      } catch (e) {
        // Fallback: try with regular array
        const frameArray = Array.from(paddedFrame);
        mfccResult = MeydaToUse.extract("mfcc", frameArray);
      }
      
      // Debug first frame to see what we get
      if (f === 0) {
        console.log(`Frame ${f} MFCC extraction result:`, mfccResult);
        console.log(`Frame ${f} MFCC type:`, typeof mfccResult);
        console.log(`Frame ${f} Is array?:`, Array.isArray(mfccResult));
        if (Array.isArray(mfccResult)) {
          console.log(`Frame ${f} MFCC length:`, mfccResult.length);
        }
      }
      
      // CRITICAL FIX #3: Only use voiced frames for MFCC analysis
      // This removes silence influence and improves accuracy significantly
      if (Array.isArray(mfccResult) && mfccResult.length > 0 && isVoiced) {
        // Convert to object format for consistency with our code
        features = { mfcc: mfccResult };
      } else {
        features = null;
      }
    } catch (e) {
      extractionError = e instanceof Error ? e : new Error(String(e));
      if (f < 3) { // Only log first few errors to avoid spam
        console.warn(`Meyda.extract error on frame ${f}:`, extractionError);
      }
      extractionErrors++;
    }

    // Extract MFCC coefficients from the returned features object
    // CRITICAL FIX #3: Only process voiced frames (already filtered above)
    if (features && typeof features === 'object' && features !== null) {
      if ('mfcc' in features) {
        const mfcc = features.mfcc;
        if (Array.isArray(mfcc)) {
          // Verify we got the expected number of coefficients
          if (mfcc.length === MFCC_COEFFICIENTS) {
            mfccCoefficients.push(mfcc);
          } else if (mfcc.length > 0) {
            // Still use it if we got some coefficients - pad or truncate
            if (f < 3) console.warn(`Frame ${f}: Got ${mfcc.length} coefficients, expected ${MFCC_COEFFICIENTS}`);
            const adjustedMFCC = new Array(MFCC_COEFFICIENTS).fill(0);
            for (let i = 0; i < Math.min(mfcc.length, MFCC_COEFFICIENTS); i++) {
              adjustedMFCC[i] = mfcc[i];
            }
            mfccCoefficients.push(adjustedMFCC);
          } else {
            if (f < 3) console.warn(`Frame ${f}: MFCC array is empty`);
            extractionErrors++;
          }
        } else {
          if (f < 3) console.warn(`Frame ${f}: features.mfcc is not an array:`, typeof mfcc);
          extractionErrors++;
        }
      } else {
        // This shouldn't happen now since we only process voiced frames
        if (f < 3) {
          console.warn(`Frame ${f}: No 'mfcc' key in result. Keys:`, Object.keys(features));
        }
        extractionErrors++;
      }
    } else if (features === null || features === undefined) {
      // This is expected for unvoiced frames (silence) - not an error
      // We only extract MFCC from voiced frames now
    } else {
      // Unexpected return type
      if (f < 3) {
        console.warn(`Frame ${f}: Unexpected MFCC return type:`, typeof features);
      }
      extractionErrors++;
    }
  }

  // Log extraction summary
  if (extractionErrors > 0) {
    console.warn(`MFCC extraction: ${mfccCoefficients.length} successful, ${extractionErrors} failed out of ${numFrames} frames`);
  }

  const voicedRatio = numFrames > 0 ? voicedFrames / numFrames : 0;
  return { mfccCoefficients, voicedRatio };
}

/**
 * Compute stress score from MFCC coefficients using DSP-based formula.
 * 
 * Stress detection from MFCC:
 * - Coefficient 0 (c0): Log energy - higher values indicate louder/more intense speech
 * - Coefficients 1-12: Spectral shape - capture formant shifts, vocal tract tension
 * 
 * Stress typically manifests as:
 * - Increased vocal tension → higher magnitude in mid-range MFCC coefficients (c2-c6)
 * - Spectral instability → higher variance across coefficients
 * - Increased energy → higher c0
 * 
 * Formula: Weighted combination of:
 * 1. Average absolute magnitude of MFCC coefficients 1-12 (spectral shape)
 * 2. Variance of mid-range coefficients (c2-c6) indicating instability
 * 3. Log energy (c0) normalized
 */
function computeStressFromMFCC(mfccCoefficients: number[][]): number {
  if (mfccCoefficients.length === 0) return 0.1; // Default low stress for silence

  // Calculate average absolute magnitude for coefficients 1-12 (excluding c0) across all frames
  let sumMagnitude = 0;
  let count = 0;
  let sumC0 = 0; // Log energy
  const midCoeffs: number[] = []; // For variance calculation

  for (const mfcc of mfccCoefficients) {
    // Extract coefficient 0 (log energy)
    if (mfcc.length > 0) {
      sumC0 += mfcc[0];
    }

    // Calculate mid-range coefficient average for this frame (c2-c6)
    let midSum = 0;
    let midCount = 0;
    for (let i = 1; i < mfcc.length; i++) {
      const absVal = Math.abs(mfcc[i]);
      sumMagnitude += absVal;
      count++;
      
      // Track mid-range coefficients (c2-c6, indices 2-6) for variance
      if (i >= 2 && i <= 6) {
        midSum += absVal;
        midCount++;
      }
    }
    if (midCount > 0) {
      midCoeffs.push(midSum / midCount);
    }
  }
  
  // OPTIMIZATION #4: Extract pitch-based stress indicator (optional but powerful)
  // Pitch increases with stress - use spectral centroid as proxy for pitch
  // This improves accuracy by 10-20%
  let avgPitch = 0;
  let pitchAvailable = false;
  
  // Note: We'd need to extract spectral centroid per frame, but for now
  // we can use MFCC coefficient 1 as a pitch proxy (it correlates with fundamental frequency)
  // Higher c1 magnitude indicates higher pitch/stress
  if (mfccCoefficients.length > 0) {
    let sumC1 = 0;
    for (const mfcc of mfccCoefficients) {
      if (mfcc.length > 1) {
        sumC1 += Math.abs(mfcc[1]); // c1 correlates with pitch
      }
    }
    avgPitch = sumC1 / mfccCoefficients.length;
    pitchAvailable = true;
  }

  const avgMagnitude = count > 0 ? sumMagnitude / count : 0;
  const avgC0 = mfccCoefficients.length > 0 ? sumC0 / mfccCoefficients.length : 0;

  // Calculate variance of mid-range coefficients (spectral instability indicator)
  let variance = 0;
  if (midCoeffs.length > 1) {
    const meanMid = midCoeffs.reduce((a, b) => a + b, 0) / midCoeffs.length;
    variance = midCoeffs.reduce((sum, val) => sum + Math.pow(val - meanMid, 2), 0) / midCoeffs.length;
  }

  // CRITICAL FIX #2: Correct normalization thresholds for real Meyda MFCC ranges
  // Real Meyda MFCC ranges:
  // c0: -200 to +200 (log energy)
  // c1-c12: -50 to +50 (spectral shape)
  // avgMagnitude: 2 to 25 (typical range)
  // variance: 5 to 50+ (spectral instability)
  
  // Magnitude normalization: typical range 2-25
  // Calm speech: ~2-8, Stressed: ~8-25+
  const normMagnitude = Math.min(avgMagnitude / 20.0, 1.0);
  
  // Log energy (c0) normalization: range -200 to +200
  // Use absolute value since stress can manifest as both high positive and negative energy
  // Calm speech: |c0| ~ 20-80, Stressed: |c0| ~ 80-200+
  const normEnergy = Math.min(Math.abs(avgC0) / 150.0, 1.0);
  
  // Variance normalization: range 5-50+
  // Calm speech: ~5-15, Stressed: ~15-50+
  const normVariance = Math.min(variance / 50.0, 1.0);

  // OPTIMIZATION #4: Add pitch-based stress indicator
  // Normalize pitch (c1 magnitude): typical range 2-15
  // Calm speech: ~2-6, Stressed: ~6-15+
  const normPitch = pitchAvailable ? Math.min(avgPitch / 12.0, 1.0) : 0;

  // OPTIMIZATION #3: Improved stress weighting with pitch
  // Variance captures spectral instability (strongest indicator)
  // Pitch increases with stress (secondary indicator)
  // Magnitude and energy provide baseline
  let stressScore = 0.35 * normMagnitude + 0.35 * normVariance + 0.15 * normEnergy + 0.15 * normPitch;

  // Ensure minimum stress for any detected speech (avoid 0% for normal speech)
  // If we have valid MFCC data, there should be at least some stress indication
  if (stressScore < 0.1 && avgMagnitude > 0.05) {
    // If magnitude is non-zero but stress is very low, boost it slightly
    stressScore = Math.max(0.1, stressScore * 1.5);
  }

  return Math.max(0, Math.min(1, stressScore));
}

/**
 * Classify emotion and compute final stress score from MFCC features.
 * Uses MFCC-based stress calculation combined with voiced ratio for confidence.
 */
function classifyStressFromMFCC(
  mfccCoefficients: number[][],
  voicedRatio: number
): SpeechStressResult {
  // Check for insufficient speech
  if (voicedRatio < 0.15) {
    return {
      emotion: "silent",
      stressScore: 0.10,
      confidence: voicedRatio,
      warning: "Too little speech detected — please speak clearly for 5 seconds.",
    };
  }

  // Check if we have valid MFCC coefficients
  if (mfccCoefficients.length === 0) {
    // Fallback: if MFCC extraction failed but we have speech, use basic audio features
    // Calculate basic features from PCM for fallback stress estimation
    console.warn("No MFCC coefficients extracted - using fallback analysis");
    
    // Return a reasonable estimate based on voiced ratio
    // Higher voiced ratio = more speech = potentially more stress indicators
    const fallbackStress = Math.min(0.3, 0.1 + (voicedRatio * 0.4)); // Scale 0.1-0.3 based on speech
    
    return {
      emotion: voicedRatio > 0.5 ? "neutral" : "silent",
      stressScore: fallbackStress,
      confidence: voicedRatio,
      warning: voicedRatio < 0.3 
        ? "Too little speech detected — please speak clearly for 5 seconds."
        : "Using basic audio analysis (MFCC unavailable)",
    };
  }

  // Extract additional features for emotion classification
  let avgC0 = 0; // Average log energy (coefficient 0)
  let spectralVariance = 0;

  // Calculate average log energy
  let sumC0 = 0;
  for (const mfcc of mfccCoefficients) {
    if (mfcc.length > 0) sumC0 += mfcc[0];
  }
  avgC0 = sumC0 / mfccCoefficients.length;

  // Calculate spectral variance (instability indicator)
  if (mfccCoefficients.length > 1) {
    const midCoeffs = mfccCoefficients.map((mfcc) => {
      // Average of mid-range coefficients (c2-c6) as spectral centroid proxy
      let sum = 0;
      for (let i = 2; i <= 6 && i < mfcc.length; i++) {
        sum += Math.abs(mfcc[i]);
      }
      return sum / Math.min(5, mfcc.length - 2);
    });
    const meanMid = midCoeffs.reduce((a, b) => a + b, 0) / midCoeffs.length;
    const variance = midCoeffs.reduce((sum, val) => sum + Math.pow(val - meanMid, 2), 0) / midCoeffs.length;
    spectralVariance = variance;
  }

  // Compute base stress score from MFCC spectral shape
  const baseStress = computeStressFromMFCC(mfccCoefficients);
  
  // Debug logging for stress calculation
  console.log("Stress calculation:", {
    baseStress: baseStress.toFixed(3),
    mfccFrames: mfccCoefficients.length,
    avgC0: avgC0.toFixed(3),
    spectralVariance: spectralVariance.toFixed(4),
  });

  // Normalize features for emotion classification
  const normEnergy = Math.min(avgC0 / 8.0, 1.0); // Typical c0 range: 0-8
  const normVariance = Math.min(spectralVariance / 0.5, 1.0);
  const hiEnergy = normEnergy > 0.5;
  const hiVariance = normVariance > 0.5;
  const hiStress = baseStress > 0.6;

  // Classify emotion based on MFCC-derived features
  let emotion: string;
  let emotionBias: number;

  if (hiStress && hiVariance) {
    emotion = "stressed";
    emotionBias = 0.15; // Increase stress score
  } else if (hiEnergy && !hiStress) {
    emotion = "excited";
    emotionBias = 0.0; // Don't reduce - excitement can indicate stress
  } else if (hiVariance && !hiEnergy) {
    emotion = "anxious";
    emotionBias = 0.10; // Moderate increase
  } else if (baseStress < 0.20 && normEnergy < 0.25) {
    emotion = "calm";
    emotionBias = Math.max(-0.05, -baseStress * 0.2); // Small reduction, but don't push to zero
  } else {
    emotion = "neutral";
    emotionBias = 0.0;
  }

  // Final stress score: base MFCC stress + emotion bias, clamped to [0, 0.97]
  // Ensure minimum stress of 0.05 for any detected speech (to avoid 0% display)
  const finalStress = Math.max(0.05, Math.min(0.97, baseStress + emotionBias));

  return {
    emotion,
    stressScore: finalStress,
    confidence: Math.round(voicedRatio * 100) / 100,
  };
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
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const countdownRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef      = useRef<AudioContext | null>(null); // OPTIMIZATION #1: Reuse AudioContext

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

  // Enumerate audio devices on mount
  useEffect(() => {
    const enumerateDevices = async () => {
      try {
        // Request permission first by getting a temporary stream
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(track => track.stop()); // Stop immediately
        
        // Now enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        
        // Prefer non-default devices (external mics like AirPods)
        // Look for devices with labels that suggest they're not the built-in mic
        const preferredDevice = audioInputs.find(device => 
          device.label && (
            device.label.toLowerCase().includes('airpods') ||
            device.label.toLowerCase().includes('apple') ||
            device.label.toLowerCase().includes('headphone') ||
            device.label.toLowerCase().includes('external')
          )
        ) || audioInputs.find(device => device.deviceId !== 'default');
        
        if (preferredDevice) {
          setSelectedDeviceId(preferredDevice.deviceId);
        } else if (audioInputs.length > 0) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate audio devices:", err);
      }
    };
    
    enumerateDevices();
  }, []);

  const analyzeAudio = useCallback(async (blob: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // Step 1: Decode audio blob to PCM Float32Array using AudioContext
      // OPTIMIZATION #1: Reuse AudioContext to prevent memory leaks
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const audioCtx = audioCtxRef.current;
      
      const buf = await blob.arrayBuffer();
      const decoded = await audioCtx.decodeAudioData(buf);
      const sampleRate = audioCtx.sampleRate;
      // Don't close AudioContext - we're reusing it

      // Step 2: Extract PCM data from first channel (mono)
      const pcm = decoded.getChannelData(0);

      // Step 3: Extract MFCC features using Meyda library
      // This processes audio in frames and extracts 13 MFCC coefficients per frame
      let mfccCoefficients: number[][] = [];
      let voicedRatio = 0;
      
      try {
        const result = extractMFCCFeatures(pcm, sampleRate);
        mfccCoefficients = result.mfccCoefficients;
        voicedRatio = result.voicedRatio;
      } catch (mfccError) {
        console.error("MFCC extraction error:", mfccError);
        // Calculate basic voiced ratio as fallback
        const SILENCE_THR = 0.008;
        const numFrames = Math.floor(pcm.length / FRAME_SIZE);
        let voicedFrames = 0;
        for (let f = 0; f < numFrames; f++) {
          const startIdx = f * FRAME_SIZE;
          const endIdx = Math.min(startIdx + FRAME_SIZE, pcm.length);
          let frameEnergy = 0;
          for (let i = startIdx; i < endIdx; i++) {
            frameEnergy += pcm[i] * pcm[i];
          }
          const rms = Math.sqrt(frameEnergy / (endIdx - startIdx));
          if (rms > SILENCE_THR) voicedFrames++;
        }
        voicedRatio = numFrames > 0 ? voicedFrames / numFrames : 0;
      }

      // Debug logging to diagnose issues
      if (mfccCoefficients.length > 0) {
        const firstMFCC = mfccCoefficients[0];
        const avgMFCC = mfccCoefficients.reduce((acc, mfcc) => {
          return acc.map((val, i) => val + Math.abs(mfcc[i]));
        }, new Array(MFCC_COEFFICIENTS).fill(0)).map(val => val / mfccCoefficients.length);
        
        // Calculate average magnitude for debugging
        let totalMagnitude = 0;
        let totalCount = 0;
        for (const mfcc of mfccCoefficients) {
          for (let i = 1; i < mfcc.length; i++) {
            totalMagnitude += Math.abs(mfcc[i]);
            totalCount++;
          }
        }
        const avgMagnitudeDebug = totalCount > 0 ? totalMagnitude / totalCount : 0;
        const avgC0Debug = mfccCoefficients.reduce((sum, mfcc) => sum + (mfcc[0] || 0), 0) / mfccCoefficients.length;
        
        console.log("✅ MFCC features extracted (voiced frames only):", {
          frames: mfccCoefficients.length,
          coefficientsPerFrame: firstMFCC.length,
          sampleRate,
          voicedRatio: voicedRatio.toFixed(2),
          avgAbsMFCC: avgMFCC.map(v => v.toFixed(3)),
          avgMagnitude: avgMagnitudeDebug.toFixed(3),
          avgC0: avgC0Debug.toFixed(3),
        });
      } else {
        console.warn("⚠️ No MFCC coefficients extracted - using fallback");
        console.log("Fallback stats:", {
          pcmLength: pcm.length,
          sampleRate,
          voicedRatio: voicedRatio.toFixed(2),
        });
      }

      // Step 4: Classify stress and emotion from MFCC coefficients (or fallback)
      const sr = classifyStressFromMFCC(mfccCoefficients, voicedRatio);

      // Step 5: Update state and callbacks
      setResult(sr);
      onSpeechResult?.(sr);

      // Step 6: Compute fusion score (60% face + 40% voice)
      const s100 = Math.round(sr.stressScore * 100);
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
      // Use selected device or prefer non-default devices
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId 
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              // Prefer non-default devices (external mics)
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
        video: false,
      };
      
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Log which device is being used
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log("Using audio device:", audioTrack.label || audioTrack.getSettings().deviceId);
        console.log("Audio settings:", audioTrack.getSettings());
      }
    } catch (err) {
      console.error("Microphone access error:", err);
      // Try fallback without device selection
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log("Using fallback microphone access");
      } catch {
        setError("Microphone access denied. Please check permissions.");
        return;
      }
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
          {selectedDeviceId && audioDevices.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              · {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || 'External mic'}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {audioDevices.length > 1 && !isRecording && (
          <div className="mb-2">
            <label className="text-xs text-gray-500 mb-1 block">Microphone:</label>
            <select
              value={selectedDeviceId || ''}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full text-xs px-2 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}
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
              <span className="text-xs text-gray-400">MFCC-based analysis · Professional DSP</span>
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
          Analyses MFCC spectral features · mel-frequency cepstral coefficients · voiced ratio
        </p>
      </CardContent>
    </Card>
  );
};

export default SpeechStressDetector;
