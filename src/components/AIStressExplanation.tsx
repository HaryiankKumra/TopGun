
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, RefreshCw, AlertCircle, Sparkles, Clock } from 'lucide-react';

interface AIStressExplanationProps {
  explanation: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRetry: () => void;
  onClearError: () => void;
}

const AIStressExplanation: React.FC<AIStressExplanationProps> = ({
  explanation,
  loading,
  error,
  lastUpdated,
  onRetry,
  onClearError,
}) => {
  if (!explanation && !loading && !error) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
      <CardHeader className="p-4 lg:p-6">
        <CardTitle className="flex items-center justify-between text-purple-800 dark:text-purple-200 text-lg">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Health Insights
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            )}
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-300">
              <Clock className="w-3 h-3" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 lg:p-6 pt-0">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Unable to generate explanation</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              <Button
                onClick={onClearError}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {loading && !explanation && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">Analyzing your physiological data...</span>
            </div>
          </div>
        )}

        {explanation && (
          <div className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700 text-xs">
                    Personalized Analysis
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIStressExplanation;
