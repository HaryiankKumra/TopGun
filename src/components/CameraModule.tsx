
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle, Play, Square, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as faceapi from 'face-api.js';

interface CameraModuleProps {
  isActive: boolean;
  onEmotionDetected: (emotion: string, confidence: number) => void;
  onCameraStarted?: () => void;
}

const CameraModule: React.FC<CameraModuleProps> = ({ isActive, onEmotionDetected, onCameraStarted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      if (modelsLoaded || isLoadingModels) return;
      
      try {
        setIsLoadingModels(true);
        console.log('📦 Loading face-api.js models...');
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        
        setModelsLoaded(true);
        console.log('✅ Face detection models loaded successfully');
      } catch (err) {
        console.error('❌ Error loading face models:', err);
        setError('Failed to load emotion detection models');
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (isActive && cameraStarted && modelsLoaded) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, cameraStarted, modelsLoaded]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          // Start continuous analysis
          startContinuousAnalysis();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startContinuousAnalysis = () => {
    if (analysisIntervalRef.current) return;
    
    // Analyze every 2 seconds
    analysisIntervalRef.current = setInterval(async () => {
      await analyzeFrame();
    }, 2000);
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !modelsLoaded || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const expressions = detections.expressions;
        
        // Find dominant emotion
        const emotionEntries = Object.entries(expressions) as [string, number][];
        const dominant = emotionEntries.reduce((prev, curr) => 
          curr[1] > prev[1] ? curr : prev
        );
        
        const emotion = dominant[0];
        const conf = dominant[1];
        
        // Map face-api emotions to stress level
        const stressMapping: Record<string, string> = {
          angry: 'High Stress',
          fearful: 'High Stress',
          sad: 'Moderate Stress',
          disgusted: 'Moderate Stress',
          surprised: 'Moderate Stress',
          neutral: 'Low Stress',
          happy: 'No Stress'
        };
        
        const stress = stressMapping[emotion] || 'Unknown';
        
        setCurrentEmotion(emotion);
        setStressLevel(stress);
        setConfidence(conf);
        
        // Call parent callback
        onEmotionDetected(emotion, conf);
        
        console.log(`😊 Detected: ${emotion} (${(conf * 100).toFixed(1)}%) - ${stress}`);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleCamera = () => {
    if (!modelsLoaded) {
      toast({
        title: "Models Loading",
        description: "Please wait for emotion detection models to load...",
      });
      return;
    }
    const nowStarting = !cameraStarted;
    setCameraStarted(nowStarting);
    if (nowStarting) {
      // Starting camera — notify parent so audio can start simultaneously
      setCurrentEmotion(null);
      setStressLevel(null);
      setConfidence(0);
      onCameraStarted?.();
    }
    // When stopping, the last emotion/stress stays visible
  };

  const getEmotionColor = (emotion: string | null) => {
    const colors: Record<string, string> = {
      happy: 'bg-green-100 text-green-800 border-green-200',
      sad: 'bg-blue-100 text-blue-800 border-blue-200',
      angry: 'bg-red-100 text-red-800 border-red-200',
      surprised: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200',
      fearful: 'bg-purple-100 text-purple-800 border-purple-200',
      disgusted: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return emotion ? (colors[emotion.toLowerCase()] || colors.neutral) : colors.neutral;
  };

  const getStressColor = (stress: string | null) => {
    if (!stress) return 'bg-gray-100 text-gray-800';
    if (stress.includes('High')) return 'bg-red-100 text-red-800';
    if (stress.includes('Moderate')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {isLoadingModels ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Loading emotion detection models...</p>
            </div>
          </div>
        ) : !cameraStarted ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click "Start" to begin camera analysis</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {isAnalyzing && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-purple-500 text-white">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analyzing
                </Badge>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={handleToggleCamera}
          size="sm"
          variant={cameraStarted ? "destructive" : "default"}
          disabled={isLoadingModels}
        >
          {cameraStarted ? (
            <>
              <Square className="w-4 h-4 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" />
              Start
            </>
          )}
        </Button>
        <Badge className={cameraActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {cameraActive ? 'Live' : 'Inactive'}
        </Badge>
      </div>

      {currentEmotion && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Emotion</p>
            <Badge className={getEmotionColor(currentEmotion)}>
              {currentEmotion.charAt(0).toUpperCase() + currentEmotion.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Stress</p>
            <Badge className={getStressColor(stressLevel)}>
              {stressLevel}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <Badge variant="outline">
              {(confidence * 100).toFixed(0)}%
            </Badge>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        Powered by face-api.js (Browser ML)
      </div>
    </div>
  );
};

export default CameraModule;
