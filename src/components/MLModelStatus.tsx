
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Heart, Thermometer, Zap, Eye } from "lucide-react";

const MLModelStatus: React.FC = () => {
  const models = [
    {
      name: "GSR Stress Model",
      type: "gsr",
      icon: <Zap className="w-4 h-4" />,
      accuracy: 87.3,
      status: "active",
      lastUpdate: "2 mins ago",
      modelFile: "gsr_model.json",
      color: "yellow",
    },
    {
      name: "Heart Rate Variability",
      type: "heart_rate",
      icon: <Heart className="w-4 h-4" />,
      accuracy: 91.7,
      status: "active",
      lastUpdate: "1 min ago",
      modelFile: "hrv_model.json",
      color: "red",
    },
    {
      name: "Temperature Analysis",
      type: "temperature",
      icon: <Thermometer className="w-4 h-4" />,
      accuracy: 83.9,
      status: "active",
      lastUpdate: "3 mins ago",
      modelFile: "temp_model.json",
      color: "orange",
    },
    {
      name: "Facial Emotion Detection",
      type: "facial",
      icon: <Eye className="w-4 h-4" />,
      accuracy: 89.2,
      status: "active",
      lastUpdate: "30 secs ago",
      modelFile: "facial_model.json",
      color: "purple",
    },
    {
      name: "Combined Stress Predictor",
      type: "combined",
      icon: <Activity className="w-4 h-4" />,
      accuracy: 94.1,
      status: "active",
      lastUpdate: "1 min ago",
      modelFile: "combined_model.json",
      color: "blue",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      yellow: "text-yellow-600 bg-yellow-50 border-yellow-200",
      red: "text-red-600 bg-red-50 border-red-200",
      orange: "text-orange-600 bg-orange-50 border-orange-200",
      purple: "text-purple-600 bg-purple-50 border-purple-200",
      blue: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return (
      colorMap[color as keyof typeof colorMap] ||
      "text-gray-600 bg-gray-50 border-gray-200"
    );
  };

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Hugging Face ML Models Status
          <Badge className="bg-purple-100 text-purple-800">5 Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {models.map((model, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getColorClasses(model.color)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {model.icon}
                  <h3 className="font-semibold text-sm">{model.name}</h3>
                </div>
                <Badge
                  className={
                    model.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {model.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Accuracy:</span>
                  <span className="font-semibold">{model.accuracy}%</span>
                </div>
                <Progress value={model.accuracy} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Last prediction: {model.lastUpdate}</span>
                </div>
                <div className="text-xs">
                  <code className="bg-white/50 px-1 rounded">
                    {model.modelFile}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Model Integration Instructions */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 text-purple-800">
            Hugging Face Model Integration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-purple-700">
                Model Configuration
              </h4>
              <div className="bg-white/70 p-4 rounded-lg text-sm">
                <div className="text-gray-700">
                  <div>• Emotion Detection: Facebook DETR</div>
                  <div>• Stress Analysis: Custom Models</div>
                  <div>• Real-time Processing</div>
                  <div>• Browser-based Inference</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-purple-700">
                ⚡ Integration Status
              </h4>
              <div className="bg-white/70 p-4 rounded-lg text-sm">
                <pre className="text-gray-700">{`// Hugging Face Integration
import { pipeline } from '@huggingface/transformers';

const emotion = await pipeline(
  'image-classification',
  'microsoft/DialoGPT-medium'
);

const result = await emotion(imageData);`}</pre>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-100/50 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Author:</strong> Haryiank Kumra
              <br />
              <strong>Integration:</strong> Real-time emotion detection using Hugging Face Transformers for browser-based inference without external API calls.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLModelStatus;
