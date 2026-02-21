
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

interface BackendPredictionProps {
  prediction: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRetry?: () => void;
  onClearError?: () => void;
}

const BackendPrediction: React.FC<BackendPredictionProps> = ({
  prediction,
  loading,
  error,
  lastUpdated,
  onRetry,
  onClearError
}) => {
  const getPredictionLevel = (pred: number) => {
    if (pred < 0.3) return { level: 'Low Risk', color: 'bg-green-100 text-green-800 border-green-300', severity: 'low' };
    if (pred < 0.7) return { level: 'Moderate Risk', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', severity: 'moderate' };
    return { level: 'High Risk', color: 'bg-red-100 text-red-800 border-red-300', severity: 'high' };
  };

  const predictionInfo = prediction !== null ? getPredictionLevel(prediction) : null;

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-purple-200 dark:border-purple-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <Brain className="w-5 h-5" />
          Backend AI Prediction
          {loading && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <div className="flex gap-2 mt-2">
                {onRetry && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onRetry}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
                {onClearError && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={onClearError}
                    className="h-7 text-xs"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {prediction !== null && predictionInfo && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {(prediction * 100).toFixed(1)}%
              </div>
              <Badge className={predictionInfo.color}>
                {predictionInfo.level}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Prediction Score</span>
                <span>{prediction.toFixed(4)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    predictionInfo.severity === 'low' ? 'bg-green-500' :
                    predictionInfo.severity === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${prediction * 100}%` }}
                />
              </div>
            </div>

            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-3 h-3" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {!loading && !error && prediction === null && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for sensor data...</p>
            <p className="text-xs">Need 20+ readings for prediction</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackendPrediction;
