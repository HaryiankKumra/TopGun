
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Activity, Thermometer, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface StressMetricsProps {
  stressLevel: number;
  stressStatus: 'low' | 'moderate' | 'high';
  signalQuality: {
    bvp: number;
    eda: number;
    temp: number;
    hr: number;
  };
  isMonitoring: boolean;
}

const StressMetrics: React.FC<StressMetricsProps> = ({
  stressLevel,
  stressStatus,
  signalQuality,
  isMonitoring
}) => {
  const getStressColor = () => {
    switch (stressStatus) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStressMessage = () => {
    switch (stressStatus) {
      case 'low': return 'You\'re in a calm state. Keep up the good work!';
      case 'moderate': return 'Moderate stress detected. Consider taking a short break.';
      case 'high': return 'High stress levels detected. Time for relaxation techniques.';
      default: return 'Monitoring your stress levels...';
    }
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Activity className="w-5 h-5 text-blue-500" />
          Stress Analysis
          <Badge className={isMonitoring ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
            {isMonitoring ? 'Active' : 'Paused'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Stress Level */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(stressLevel * 100)}%
          </div>
          <Badge className={getStressColor()}>
            {stressStatus.toUpperCase()} STRESS
          </Badge>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {getStressMessage()}
          </p>
        </div>

        {/* Stress Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>Current Level</span>
            <span>{Math.round(stressLevel * 100)}%</span>
          </div>
          <Progress 
            value={stressLevel * 100} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Calm</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        {/* Signal Quality Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white">Signal Quality</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm">Heart Rate</span>
              </div>
              <div className="flex items-center gap-1">
                {signalQuality.hr > 85 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">{signalQuality.hr}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm">EDA</span>
              </div>
              <div className="flex items-center gap-1">
                {signalQuality.eda > 85 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">{signalQuality.eda}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Temperature</span>
              </div>
              <div className="flex items-center gap-1">
                {signalQuality.temp > 85 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">{signalQuality.temp}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Overall</span>
              </div>
              <div className="flex items-center gap-1">
                {Math.round((signalQuality.hr + signalQuality.eda + signalQuality.temp + signalQuality.bvp) / 4) > 85 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-medium">
                  {Math.round((signalQuality.hr + signalQuality.eda + signalQuality.temp + signalQuality.bvp) / 4)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">Quick Tips</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            {stressStatus === 'low' && (
              <p>✨ Great job! Consider maintaining your current activities.</p>
            )}
            {stressStatus === 'moderate' && (
              <p>🌱 Try deep breathing exercises or a short walk.</p>
            )}
            {stressStatus === 'high' && (
              <p>🧘 Take immediate action: practice 4-7-8 breathing or meditation.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StressMetrics;
