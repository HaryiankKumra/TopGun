import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Heart, Activity } from "lucide-react";

interface ECGChartProps {
  isActive: boolean;
  rawEcgSignal?: number;
  heartRate?: number;
  leadsOffDetected?: boolean;
  arrhythmiaDetected?: boolean;
}

interface ECGDataPoint {
  time: number;
  value: number;
  normalizedTime: number;
}

const ECGChart: React.FC<ECGChartProps> = ({ 
  isActive, 
  rawEcgSignal, 
  heartRate, 
  leadsOffDetected,
  arrhythmiaDetected 
}) => {
  const [ecgData, setEcgData] = useState<ECGDataPoint[]>([]);
  const [currentBPM, setCurrentBPM] = useState(heartRate || 72);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate realistic ECG waveform
  const generateECGPoint = (time: number): number => {
    if (leadsOffDetected) return 0;
    
    const bpm = currentBPM;
    const beatDuration = 60000 / bpm; // milliseconds per beat
    const normalizedTime = (time % beatDuration) / beatDuration;
    
    // ECG waveform components
    let signal = 0;
    
    // P wave (0.08-0.12 of cycle)
    if (normalizedTime >= 0.08 && normalizedTime <= 0.12) {
      const pPhase = (normalizedTime - 0.08) / 0.04;
      signal += 0.1 * Math.sin(pPhase * Math.PI);
    }
    
    // QRS complex (0.15-0.25 of cycle) - main spike
    if (normalizedTime >= 0.15 && normalizedTime <= 0.25) {
      const qrsPhase = (normalizedTime - 0.15) / 0.1;
      if (qrsPhase < 0.3) {
        // Q wave (small negative)
        signal -= 0.1 * Math.sin(qrsPhase * Math.PI / 0.3);
      } else if (qrsPhase < 0.7) {
        // R wave (large positive)
        signal += 0.8 * Math.sin((qrsPhase - 0.3) * Math.PI / 0.4);
      } else {
        // S wave (negative)
        signal -= 0.2 * Math.sin((qrsPhase - 0.7) * Math.PI / 0.3);
      }
    }
    
    // T wave (0.35-0.55 of cycle)
    if (normalizedTime >= 0.35 && normalizedTime <= 0.55) {
      const tPhase = (normalizedTime - 0.35) / 0.2;
      signal += 0.15 * Math.sin(tPhase * Math.PI);
    }
    
    // Add some noise and irregularity if arrhythmia detected
    if (arrhythmiaDetected) {
      signal += (Math.random() - 0.5) * 0.05;
      // Occasionally skip or double beats
      if (Math.random() < 0.1) {
        signal *= 0.5;
      }
    }
    
    // Add baseline noise
    signal += (Math.random() - 0.5) * 0.02;
    
    // Use raw ECG signal if provided, otherwise use generated signal
    return rawEcgSignal !== undefined ? (rawEcgSignal / 2048) - 1 : signal;
  };

  useEffect(() => {
    if (heartRate) {
      setCurrentBPM(heartRate);
    }
  }, [heartRate]);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // High frequency sampling for ECG (10ms intervals = 100Hz)
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const ecgValue = generateECGPoint(now);
      
      setEcgData(prevData => {
        const newData = [...prevData, { 
          time: now, 
          value: ecgValue,
          normalizedTime: now % 1000 // For smooth scrolling
        }];
        
        // Keep only last 5 seconds of data (500 points at 100Hz)
        return newData.length > 500 ? newData.slice(-500) : newData;
      });
    }, 10);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, currentBPM, rawEcgSignal, leadsOffDetected, arrhythmiaDetected]);

  const getStatusColor = () => {
    if (leadsOffDetected) return 'bg-red-100 text-red-800 border-red-200';
    if (arrhythmiaDetected) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusText = () => {
    if (leadsOffDetected) return 'Leads Off';
    if (arrhythmiaDetected) return 'Irregular';
    return 'Normal';
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            ECG Monitor (AD8232)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Badge variant="outline" className="text-gray-700 dark:text-gray-300">
              {currentBPM} BPM
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full bg-black rounded-lg p-2">
          {ecgData.length > 0 && !leadsOffDetected ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ecgData}>
                <XAxis 
                  dataKey="normalizedTime"
                  hide
                  domain={['dataMin', 'dataMax']}
                />
                <YAxis 
                  hide
                  domain={[-1.2, 1.2]}
                />
                <ReferenceLine y={0} stroke="#333" strokeWidth={1} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00ff00"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">
                  {leadsOffDetected ? 'Check electrode connections' : 
                   isActive ? 'Collecting ECG data...' : 'Start monitoring to view ECG'}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Heart Rate</div>
            <div className="font-semibold text-gray-900 dark:text-white">{currentBPM} BPM</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Signal Quality</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {leadsOffDetected ? 'Poor' : 'Good'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500 dark:text-gray-400">Rhythm</div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {arrhythmiaDetected ? 'Irregular' : 'Regular'}
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Real-time ECG</span>
          <span className={`flex items-center gap-1 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {isActive ? 'Live' : 'Stopped'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ECGChart;
