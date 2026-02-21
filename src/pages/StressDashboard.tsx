import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNavbar } from "@/components/MobileNavbar";
import { toast } from "@/hooks/use-toast";
import {
  Heart,
  Thermometer,
  Zap,
  Activity,
  AlertTriangle,
  Calendar,
  Brain,
  Wifi,
  WifiOff,
  CheckCircle,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Camera,
  FlaskConical,
  Loader2,
} from "lucide-react";
import CameraModule from "@/components/CameraModule";
import SpeechStressDetector from "@/components/SpeechStressDetector";

interface BiometricData {
  id: string;
  heart_rate: number;
  temperature: number;
  gsr_value: number;
  raw_ecg_signal: number;
  stress_level: string;
  stress_score: number;
  timestamp: string;
  created_at: string;
}

const StressDashboard: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [currentData, setCurrentData] = useState<BiometricData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [overallStress, setOverallStress] = useState<number>(0);
  const [facialEmotion, setFacialEmotion] = useState<string>("neutral");
  const [facialConfidence, setFacialConfidence] = useState<number>(0);
  const [wearableStress, setWearableStress] = useState<number>(0);
  const [wearableResult, setWearableResult] = useState<string>("--");
  const [fusionStress, setFusionStress] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isTestingWesad, setIsTestingWesad] = useState(false);
  const [speechEmotion, setSpeechEmotion] = useState<string>("—");
  const [speechStressScore, setSpeechStressScore] = useState<number>(0);
  const [speechFusionScore, setSpeechFusionScore] = useState<number | null>(null);
  const [speechTrigger, setSpeechTrigger] = useState(false);
  const [dailyStats, setDailyStats] = useState({
    averageStress: 0,
    readings: 0
  });
  const [receiving, setReceiving] = useState(false);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || !receiving) return;

    const displayName = user.full_name || user.email?.split('@')[0] || 'User';
    setUserName(displayName);
    fetchLatestData();
    fetchDailyStats();

    // ── Supabase Realtime WebSocket subscription ──────────────────────────
    const channel = supabase
      .channel('live-biometrics')
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'biometric_data_enhanced',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          console.log('⚡ Live update received:', payload.new);
          const data = payload.new as BiometricData;
          setCurrentData(data);
          setLastUpdate(new Date(data.created_at));
          setIsConnected(true);
          if (data.stress_score) setOverallStress(data.stress_score);
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ WebSocket connected — live updates active');
        }
      });

    setRealtimeChannel(channel);

    return () => {
      supabase.removeChannel(channel);
      setRealtimeChannel(null);
    };
  }, [user, receiving]);

  const fetchDailyStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await (supabase as any)
        .from("biometric_data_enhanced")
        .select("stress_score")
        .gte("timestamp", `${today}T00:00:00`)
        .lt("timestamp", `${today}T23:59:59`);

      if (data && data.length > 0) {
        const scores = data.map((d: any) => d.stress_score || 0).filter((s: number) => s > 0);
        if (scores.length > 0) {
          setDailyStats({
            averageStress: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
            readings: scores.length
          });
        }
      }
    } catch (error) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const fetchLatestData = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("biometric_data_enhanced")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setIsConnected(false);
        return;
      }

      if (data) {
        const dataAge = Date.now() - new Date(data.created_at).getTime();
        const isRecent = dataAge < 30000;
        setIsConnected(isRecent);
        setCurrentData(data as BiometricData);
        setLastUpdate(new Date(data.created_at));
        if (data.stress_score) setOverallStress(data.stress_score);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsConnected(false);
    }
  };

  const handleEmotionDetected = async (emotion: string, confidence: number) => {
    setFacialEmotion(emotion);
    setFacialConfidence(confidence);
    
    // Update fusion stress
    const facialStress = getEmotionStressScore(emotion);
    const newFusion = Math.round((facialStress * 0.4) + (wearableStress * 0.6));
    setFusionStress(newFusion);
    
    if (user) {
      try {
        const stressScore = getEmotionStressScore(emotion);
        
        // Save to biometric_data_enhanced with facial data for AI chatbot
        await (supabase as any).from('biometric_data_enhanced').insert({
          user_id: user.id,
          facial_emotion: emotion,
          facial_confidence: confidence,
          stress_score: stressScore,
          fusion_stress_score: newFusion,
          stress_level: stressScore > 60 ? 'high' : stressScore > 30 ? 'medium' : 'low',
          timestamp: new Date().toISOString(),
        });
        
        console.log('📊 Saved facial data to biometric_data_enhanced:', { emotion, confidence, stressScore, fusionStress: newFusion });
        
        // Also save to facial_analysis for historical tracking
        await (supabase as any).from('facial_analysis').insert({
          user_id: user.id,
          emotion: emotion,
          confidence: confidence,
          stress_level: stressScore,
        });
      } catch (error) {
        console.error("Error saving facial analysis:", error);
      }
    }
  };

  // Generate random sensor data and test WESAD API
  const handleTestWesad = async () => {
    setIsTestingWesad(true);
    
    try {
      // Generate random sensor data
      const randomData = Array.from({ length: 10 }, () => ({
        raw_ecg_signal: 0.3 + Math.random() * 0.8,
        gsr_value: 200 + Math.random() * 600,
        temperature: 35.5 + Math.random() * 3,
      }));
      
      const heartRate = Math.round(60 + Math.random() * 80);
      const temp = randomData[0].temperature;
      const gsr = randomData[0].gsr_value;
      const ecg = randomData[0].raw_ecg_signal;
      
      console.log('🧪 Sending test data to WESAD:', randomData);
      
      // Call WESAD proxy
      const { data, error } = await supabase.functions.invoke('wearable-stress-proxy', {
        body: { sensorData: randomData },
      });
      
      if (error) throw error;
      
      console.log('✅ WESAD response:', data);
      
      // Update wearable stress state
      const isStressed = data.prediction === 1;
      const stressValue = isStressed ? 75 : 25;
      setWearableStress(stressValue);
      setWearableResult(data.stress_level || (isStressed ? 'Stressed' : 'Not Stressed'));
      
      // Update fusion stress
      const facialStress = getEmotionStressScore(facialEmotion);
      const newFusion = Math.round((facialStress * 0.4) + (stressValue * 0.6));
      setFusionStress(newFusion);
      
      // Calculate overall stress score
      const stressScore = Math.round((stressValue + facialStress) / 2);
      
      // Insert into database with facial + wearable data
      await (supabase as any).from('biometric_data_enhanced').insert({
        user_id: user?.id,
        heart_rate: heartRate,
        temperature: Number(temp.toFixed(1)),
        gsr_value: Number(gsr.toFixed(0)),
        raw_ecg_signal: Number(ecg.toFixed(2)),
        facial_emotion: facialEmotion,
        facial_confidence: facialConfidence,
        wearable_stress_score: stressValue,
        fusion_stress_score: newFusion,
        stress_level: isStressed ? 'high' : 'low',
        stress_score: stressScore,
        timestamp: new Date().toISOString(),
      });
      
      // Update current data display
      setCurrentData({
        id: 'test',
        heart_rate: heartRate,
        temperature: temp,
        gsr_value: gsr,
        raw_ecg_signal: ecg,
        stress_level: isStressed ? 'high' : 'low',
        stress_score: stressScore,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      setOverallStress(stressScore);
      setIsConnected(true);
      setLastUpdate(new Date());
      
      toast({
        title: "WESAD Test Complete",
        description: `Result: ${data.stress_level} (Confidence: ${((data.confidence || 0.7) * 100).toFixed(0)}%)`,
      });
      
    } catch (error: any) {
      console.error('WESAD test error:', error);
      toast({
        title: "Test Failed",
        description: error.message || "Could not complete WESAD test",
        variant: "destructive",
      });
    } finally {
      setIsTestingWesad(false);
    }
  };

  const handleSpeechResult = (result: { emotion: string; stressScore: number }) => {
    setSpeechEmotion(result.emotion);
    setSpeechStressScore(Math.round(result.stressScore * 100));
  };

  const handleSpeechFusion = (score: number) => {
    setSpeechFusionScore(score);
  };

  const getEmotionStressScore = (emotion: string): number => {
    const map: { [key: string]: number } = {
      happy: 10, calm: 5, neutral: 25, surprised: 45, sad: 70, angry: 90, anxious: 85, focused: 20
    };
    return map[emotion] || 30;
  };

  const getStressColor = (score: number) => {
    if (score < 30) return "text-green-500";
    if (score < 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStressLabel = (score: number) => {
    if (score < 30) return "Low";
    if (score < 60) return "Moderate";
    return "High";
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
      case 'calm':
        return <Smile className="w-8 h-8 text-green-500" />;
      case 'sad':
      case 'angry':
      case 'anxious':
        return <Frown className="w-8 h-8 text-red-500" />;
      default:
        return <Meh className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <>
      {isMobile && <MobileNavbar />}
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 ${isMobile ? 'pt-16' : ''}`}>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Welcome, {userName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isConnected ? "default" : "secondary"} className={`${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}>
                {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
              {lastUpdate && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Main Stress Score Card */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${overallStress * 2.51} 251`} strokeLinecap="round" className={getStressColor(overallStress)} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${getStressColor(overallStress)}`}>{overallStress}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Stress</span>
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                    {getStressLabel(overallStress)} Stress
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {overallStress < 30 && "You're doing great! Keep up the good work."}
                    {overallStress >= 30 && overallStress < 60 && "Some stress detected. Consider a short break."}
                    {overallStress >= 60 && "High stress. Try some relaxation techniques."}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <Badge variant="outline"><TrendingUp className="w-3 h-3 mr-1" />Avg: {dailyStats.averageStress}%</Badge>
                    <Badge variant="outline"><Activity className="w-3 h-3 mr-1" />{dailyStats.readings} readings</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Heart Rate</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData?.heart_rate || '--'}<span className="text-sm font-normal text-gray-500 ml-1">BPM</span>
                </div>
                <Progress value={currentData?.heart_rate ? Math.min((currentData.heart_rate / 200) * 100, 100) : 0} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Temp</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData?.temperature?.toFixed(1) || '--'}<span className="text-sm font-normal text-gray-500 ml-1">°C</span>
                </div>
                <Progress value={currentData?.temperature ? ((currentData.temperature - 35) / 5) * 100 : 0} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Zap className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">EDA</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData?.gsr_value?.toFixed(0) || '--'}<span className="text-sm font-normal text-gray-500 ml-1">Ω</span>
                </div>
                <Progress value={currentData?.gsr_value ? Math.min((currentData.gsr_value / 1000) * 100, 100) : 0} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">ECG</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentData?.raw_ecg_signal?.toFixed(2) || '--'}<span className="text-sm font-normal text-gray-500 ml-1">mV</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-gray-500">Normal</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Camera, Speech & Fusion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facial Analysis */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="w-5 h-5 text-blue-500" />
                  Facial Analysis
                </CardTitle>
                <CardDescription>Real-time emotion detection via face-api.js</CardDescription>
              </CardHeader>
              <CardContent>
            <CameraModule
                isActive={true}
                onEmotionDetected={handleEmotionDetected}
                onCameraStarted={() => {
                  // trigger audio simultaneously when camera starts
                  setSpeechTrigger(false);
                  setTimeout(() => setSpeechTrigger(true), 50);
                }}
              />
              </CardContent>
            </Card>

            {/* Speech Stress */}
            <SpeechStressDetector
              faceStressScore={getEmotionStressScore(facialEmotion)}
              onSpeechResult={handleSpeechResult}
              onFusionScore={handleSpeechFusion}
              triggerRecording={speechTrigger}
            />
          </div>

          {/* Multimodal Fusion — all three signals */}
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-purple-500" />
                Multimodal Fusion Analysis
              </CardTitle>
              <CardDescription>Face · Speech · Wearable combined</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Score rows */}
                <div className="space-y-3 w-full">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Facial Stress ({facialEmotion})</span>
                      <span className={getStressColor(getEmotionStressScore(facialEmotion))}>
                        {getEmotionStressScore(facialEmotion)}%
                      </span>
                    </div>
                    <Progress value={getEmotionStressScore(facialEmotion)} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Speech Stress ({speechEmotion})</span>
                      <span className={getStressColor(speechStressScore)}>{speechStressScore}%</span>
                    </div>
                    <Progress value={speechStressScore} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Wearable Stress (WESAD)</span>
                      <span className={getStressColor(wearableStress)}>{wearableStress}%</span>
                    </div>
                    <Progress value={wearableStress} className="h-2" />
                  </div>

                  {speechFusionScore !== null && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between text-sm font-semibold mb-1">
                        <span className="text-purple-600 dark:text-purple-400">Face + Speech Fusion</span>
                        <span className={`font-bold ${getStressColor(speechFusionScore)}`}>
                          {speechFusionScore}%
                        </span>
                      </div>
                      <Progress value={speechFusionScore} className="h-3" />
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        0.6 × face + 0.4 × speech
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-indigo-600 dark:text-indigo-400">Full Fusion (incl. wearable)</span>
                      <span className={`font-bold ${getStressColor(fusionStress)}`}>{fusionStress}%</span>
                    </div>
                    <Progress value={fusionStress} className="h-3" />
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      40% facial + 60% wearable
                    </p>
                  </div>
                </div>

                {/* Emotion summary + test button */}
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700">
                    {getEmotionIcon(facialEmotion)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{facialEmotion}</h3>
                  <Badge variant="outline">{(facialConfidence * 100).toFixed(0)}% face confidence</Badge>
                  <div className="text-xs text-gray-500">
                    WESAD: <span className="font-medium">{wearableResult}</span>
                  </div>
                  <Button
                    onClick={handleTestWesad}
                    disabled={isTestingWesad}
                    className="w-full max-w-xs"
                    variant="outline"
                  >
                    {isTestingWesad ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing WESAD...</>
                    ) : (
                      <><FlaskConical className="w-4 h-4 mr-2" />Test Wearable (Random Data)</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert */}
          {overallStress >= 70 && (
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">High Stress Detected</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Consider taking a break. Try deep breathing or use the AI chat for advice.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </>
  );
};

export default StressDashboard;
