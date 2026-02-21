
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Eye, 
  Lightbulb, 
  BarChart3,
  Heart,
  Zap,
  Thermometer,
  Activity
} from "lucide-react";

interface ModelExplainerProps {
  stressLevel: number;
  signalContributions: {
    bvp: number;
    eda: number;
    temp: number;
    hr: number;
  };
}

const ModelExplainer: React.FC<ModelExplainerProps> = ({ stressLevel, signalContributions }) => {
  const totalContribution = Object.values(signalContributions).reduce((sum, val) => sum + val, 0);
  
  const normalizedContributions = {
    bvp: (signalContributions.bvp / totalContribution) * 100,
    eda: (signalContributions.eda / totalContribution) * 100,
    temp: (signalContributions.temp / totalContribution) * 100,
    hr: (signalContributions.hr / totalContribution) * 100
  };

  const signalData = [
    {
      name: 'Blood Volume Pulse',
      shortName: 'BVP',
      contribution: normalizedContributions.bvp,
      icon: <Heart className="w-5 h-5" />,
      color: 'from-red-500 to-red-600',
      description: 'Cardiovascular response patterns indicating sympathetic nervous system activation',
      features: ['Peak-to-peak intervals', 'Signal amplitude', 'Frequency components']
    },
    {
      name: 'Electrodermal Activity',
      shortName: 'EDA',
      contribution: normalizedContributions.eda,
      icon: <Zap className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Skin conductance changes reflecting emotional and cognitive arousal',
      features: ['Conductance level', 'Response peaks', 'Recovery time']
    },
    {
      name: 'Skin Temperature',
      shortName: 'TEMP',
      contribution: normalizedContributions.temp,
      icon: <Thermometer className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      description: 'Thermoregulatory responses to psychological stress',
      features: ['Temperature variation', 'Gradient changes', 'Stability patterns']
    },
    {
      name: 'Heart Rate Variability',
      shortName: 'HRV',
      contribution: normalizedContributions.hr,
      icon: <Activity className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      description: 'Autonomic nervous system balance and stress resilience',
      features: ['RMSSD values', 'Frequency domain', 'Time domain metrics']
    }
  ];

  // Sort by contribution
  const sortedSignals = signalData.sort((a, b) => b.contribution - a.contribution);

  const getInterpretation = () => {
    if (stressLevel > 0.7) {
      return {
        level: 'High Stress',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        explanation: 'Multiple physiological indicators show significant stress response. The model detected elevated sympathetic nervous system activity across cardiovascular, electrodermal, and thermoregulatory systems.'
      };
    } else if (stressLevel > 0.4) {
      return {
        level: 'Moderate Stress',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        explanation: 'Some stress indicators are elevated, but within manageable ranges. The model shows mixed signals with some physiological systems showing activation while others remain stable.'
      };
    } else {
      return {
        level: 'Low Stress',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        explanation: 'Physiological indicators suggest a relaxed state. The model detected balanced autonomic nervous system activity with minimal stress markers across all monitored systems.'
      };
    }
  };

  const interpretation = getInterpretation();

  return (
    <div className="space-y-6">
      {/* Model Overview */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Model Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${interpretation.bgColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${interpretation.color} bg-transparent border-current`}>
                {interpretation.level}
              </Badge>
              <span className="text-2xl font-bold text-gray-800">
                {(stressLevel * 100).toFixed(1)}% Confidence
              </span>
            </div>
            <p className="text-gray-700">{interpretation.explanation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Feature Importance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedSignals.map((signal, index) => (
              <div key={signal.shortName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-gradient-to-r ${signal.color} text-white`}>
                      {signal.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{signal.name}</h3>
                      <p className="text-sm text-gray-600">{signal.shortName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {signal.contribution.toFixed(1)}%
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Rank #{index + 1}
                    </Badge>
                  </div>
                </div>
                <Progress value={signal.contribution} className="h-3" />
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">{signal.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {signal.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Architecture */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-green-600" />
            Model Architecture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">CNN</div>
              <p className="text-sm text-gray-600">
                1D Convolutional layers for temporal pattern recognition in physiological signals
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">Attention</div>
              <p className="text-sm text-gray-600">
                Multi-head attention mechanism to focus on critical time segments
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">Fusion</div>
              <p className="text-sm text-gray-600">
                Feature fusion combining raw signals with engineered features
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              How it works
            </h4>
            <p className="text-sm text-gray-700">
              The model processes 30-second windows of physiological data through convolutional layers 
              that detect patterns in each signal type. An attention mechanism identifies the most 
              important time segments, while a feature fusion layer combines learned representations 
              with handcrafted features for robust stress classification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SHAP-like Visualization */}
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Feature Impact Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center text-sm text-gray-600 mb-4">
              Positive values increase stress prediction, negative values decrease it
            </div>
            {sortedSignals.map((signal) => {
              const impact = (signal.contribution / 100) * stressLevel * 2 - 0.5; // Normalize to -0.5 to 0.5
              const isPositive = impact > 0;
              const absImpact = Math.abs(impact);
              
              return (
                <div key={signal.shortName} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    {signal.shortName}
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="w-1/2 flex justify-end pr-2">
                      {!isPositive && (
                        <div 
                          className="h-6 bg-blue-500 rounded-l"
                          style={{ width: `${absImpact * 100}%` }}
                        />
                      )}
                    </div>
                    <div className="w-1 h-8 bg-gray-300"></div>
                    <div className="w-1/2 flex justify-start pl-2">
                      {isPositive && (
                        <div 
                          className="h-6 bg-red-500 rounded-r"
                          style={{ width: `${absImpact * 100}%` }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {impact > 0 ? '+' : ''}{impact.toFixed(3)}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>← Reduces Stress</span>
              <span>Increases Stress →</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelExplainer;
