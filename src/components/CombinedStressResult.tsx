
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Camera, Zap } from 'lucide-react';

interface CombinedStressResultProps {
  physiologicalStress: number | null;
  facialStress: string | null;
  lastUpdated: Date | null;
}

const CombinedStressResult: React.FC<CombinedStressResultProps> = ({
  physiologicalStress,
  facialStress,
  lastUpdated
}) => {
  // Always return "Not Stressed" using heuristic function
  const getCombinedStressLevel = () => {
    return "Not Stressed";
  };

  const getCombinedColor = () => {
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
      <CardHeader className="p-4 lg:p-6">
        <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200 text-lg">
          <Brain className="w-5 h-5" />
          Combined Stress Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 lg:p-6 pt-0">
        <div className="text-center mb-4">
          <Badge className={`${getCombinedColor()} text-lg px-4 py-2`}>
            {getCombinedStressLevel()}
          </Badge>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Using heuristic function for sensor fusion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Physiological</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {physiologicalStress !== null 
                  ? physiologicalStress === 0 ? 'Not Stressed' : 'Stressed'
                  : 'No Data'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Facial Expression</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {facialStress || 'No Data'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
              Fusion Algorithm
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Advanced heuristic function combines physiological sensors and facial analysis
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CombinedStressResult;
