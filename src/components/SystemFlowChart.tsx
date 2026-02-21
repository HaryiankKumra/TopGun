
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Wifi, 
  Database, 
  Brain, 
  Monitor, 
  Camera,
  ArrowRight,
  ArrowDown,
  Zap,
  Heart,
  Thermometer
} from "lucide-react";

const SystemFlowChart: React.FC = () => {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          System Architecture & Data Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* ESP32 Hardware Layer */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-green-800 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              ESP32 Hardware Layer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <h4 className="font-semibold">Heart Rate Sensor</h4>
                <p className="text-sm text-gray-600">Pin A0 | Analog Read</p>
                <Badge className="mt-2 bg-red-100 text-red-800">MAX30102</Badge>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <Thermometer className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <h4 className="font-semibold">Temperature Sensor</h4>
                <p className="text-sm text-gray-600">Pin D2 | Digital</p>
                <Badge className="mt-2 bg-orange-100 text-orange-800">DS18B20</Badge>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <h4 className="font-semibold">GSR Sensor</h4>
                <p className="text-sm text-gray-600">Pin A1 | Analog Read</p>
                <Badge className="mt-2 bg-yellow-100 text-yellow-800">Grove GSR</Badge>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge className="bg-green-100 text-green-800">I2C Communication Enabled</Badge>
              <Badge className="ml-2 bg-blue-100 text-blue-800">WiFi: 2.4GHz</Badge>
            </div>
          </div>

          {/* Data Flow Arrows */}
          <div className="flex justify-center">
            <ArrowDown className="w-8 h-8 text-blue-500" />
          </div>

          {/* Communication Layer */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-blue-800 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Communication & Data Transfer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">ESP32 Code Structure</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`void loop() {
  // Read sensors every 3 seconds
  int heartRate = readHeartRate();
  float temperature = readTemperature();
  float gsrValue = readGSR();
  
  // Send to Supabase Edge Function
  sendToAPI(heartRate, temperature, gsrValue);
  delay(3000);
}`}
                </pre>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">HTTP POST Payload</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`{
  "heart_rate": 75,
  "temperature": 36.5,
  "gsr_value": 0.123456,
  "timestamp": "2024-01-01T12:00:00Z"
}`}
                </pre>
              </div>
            </div>
            <div className="mt-4 text-center">
              <code className="bg-white px-3 py-1 rounded text-sm">
                POST: https://unwxteyecpgcvrhqqbgz.supabase.co/functions/v1/receive-sensor-data
              </code>
            </div>
          </div>

          {/* Data Flow Arrows */}
          <div className="flex justify-center">
            <ArrowDown className="w-8 h-8 text-blue-500" />
          </div>

          {/* Backend Processing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-purple-800 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backend Processing (Supabase)
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">1. Data Storage</h4>
                <ul className="text-sm space-y-1">
                  <li>• Store in sensor_data table</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Row Level Security</li>
                  <li>• Auto-timestamps</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">2. ML Processing</h4>
                <ul className="text-sm space-y-1">
                  <li>• Basic stress logic</li>
                  <li>• Confidence scoring</li>
                  <li>• Prediction storage</li>
                  <li>• Pattern analysis</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">3. Edge Functions</h4>
                <ul className="text-sm space-y-1">
                  <li>• receive-sensor-data</li>
                  <li>• get-latest-data</li>
                  <li>• CORS handling</li>
                  <li>• Error logging</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Data Flow Arrows */}
          <div className="flex justify-center">
            <ArrowDown className="w-8 h-8 text-blue-500" />
          </div>

          {/* Frontend & AI Layer */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-orange-800 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Frontend & AI Processing
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Camera Module
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Real-time video capture</li>
                    <li>• Facial emotion detection</li>
                    <li>• TensorFlow.js processing</li>
                    <li>• Live preview display</li>
                  </ul>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    ML Models (Client-Side)
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• 5 TensorFlow.js models</li>
                    <li>• Browser-based inference</li>
                    <li>• Real-time predictions</li>
                    <li>• No server dependency</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold text-orange-700 mb-3">React Dashboard Features</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>✅ Real-time charts</div>
                  <div>✅ Live stress monitoring</div>
                  <div>✅ Camera integration</div>
                  <div>✅ AI chatbot</div>
                  <div>✅ ESP32 status</div>
                  <div>✅ Data visualization</div>
                  <div>✅ Alert system</div>
                  <div>✅ Reset functionality</div>
                  <div>✅ Mobile responsive</div>
                  <div>✅ Real-time updates</div>
                  <div>✅ ML model status</div>
                  <div>✅ System monitoring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Info */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-cyan-800">🚀 Deployment Architecture</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold">Vercel Frontend</h4>
                <p className="text-sm text-gray-600">React app with TensorFlow.js</p>
                <Badge className="mt-2 bg-cyan-100 text-cyan-800">Edge Functions</Badge>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🗄️</div>
                <h4 className="font-semibold">Supabase Backend</h4>
                <p className="text-sm text-gray-600">Database + Edge Functions</p>
                <Badge className="mt-2 bg-green-100 text-green-800">Real-time</Badge>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-semibold">ESP32 Device</h4>
                <p className="text-sm text-gray-600">Hardware sensors</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">IoT</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemFlowChart;
