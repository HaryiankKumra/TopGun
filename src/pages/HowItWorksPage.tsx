
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/header";
import {
  Camera,
  Activity,
  Cpu,
  Wifi,
  Settings,
  Code,
  Brain,
  ArrowLeft,
  CheckCircle,
  Monitor,
} from "lucide-react";

const HowItWorksPage: React.FC = () => {
  const components = [
    {
      title: "ESP32 Biometric Sensors",
      icon: <Cpu className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
      description: "Hardware sensors for real-time physiological monitoring",
      features: [
        "Heart Rate Monitoring (PPG sensor)",
        "Skin Temperature (DS18B20)",
        "Galvanic Skin Response (GSR)",
        "Real-time data transmission",
      ],
      accent: "sky",
    },
    {
      title: "Camera-based Emotion Detection",
      icon: <Camera className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      description: "AI-powered facial emotion analysis using Hugging Face",
      features: [
        "Real-time facial expression analysis",
        "7 emotion categories detection",
        "Confidence scoring",
        "Browser-based processing",
      ],
      accent: "cyan",
    },
    {
      title: "AI Stress Prediction",
      icon: <Brain className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
      description: "Machine learning models for comprehensive stress analysis",
      features: [
        "Multi-modal data fusion",
        "Physiological pattern recognition",
        "Personalized stress thresholds",
        "Predictive analytics",
      ],
      accent: "sky",
    },
    {
      title: "Intelligent Chatbot",
      icon: <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
      description: "AI-powered conversational assistant for stress management",
      features: [
        "Personalized recommendations",
        "Stress management techniques",
        "Historical data analysis",
        "24/7 support availability",
      ],
      accent: "cyan",
    },
  ];

  const setupSteps = [
    {
      step: 1,
      title: "Hardware Setup",
      description: "Connect ESP32 with biometric sensors",
      details: [
        "Wire PPG sensor to analog pin A0",
        "Connect DS18B20 to digital pin D2",
        "Setup GSR electrodes on fingers",
        "Configure WiFi credentials",
      ],
    },
    {
      step: 2,
      title: "Software Configuration",
      description: "Setup API keys and configure the system",
      details: [
        "Add OpenAI API key in Supabase secrets",
        "Configure Hugging Face models",
        "Setup database connections",
        "Enable camera permissions",
      ],
    },
    {
      step: 3,
      title: "Calibration",
      description: "Personalize the system for accurate readings",
      details: [
        "Record baseline physiological data",
        "Set personal stress thresholds",
        "Configure notification preferences",
        "Test all sensor connections",
      ],
    },
    {
      step: 4,
      title: "Monitoring",
      description: "Start real-time stress monitoring",
      details: [
        "Enable live monitoring mode",
        "View real-time dashboards",
        "Receive stress alerts",
        "Chat with AI assistant",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-50 dark:from-slate-900 dark:via-sky-900 dark:to-slate-900 transition-colors duration-300">
      <Header />

      {/* Page Hero */}
      <section className="container mx-auto px-6 py-16">
        <div className="mb-4">
          <Link to="/">
            <Button
              variant="outline"
              className="border-sky-300 dark:border-slate-600 text-sky-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="text-center mt-8">
          <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 mb-4">
            System Overview
          </Badge>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            How{" "}
            <span className="text-sky-600 dark:text-sky-400">StressGuard</span>{" "}
            <span className="text-cyan-600 dark:text-cyan-400">AI</span>{" "}
            Works
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A complete guide to our system architecture — from hardware sensors
            to AI-powered stress analysis
          </p>
        </div>
      </section>

      {/* System Architecture */}
      <section className="bg-white/30 dark:bg-slate-800/30 py-20 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 mb-4">
              Core Components
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              System Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Four integrated modules working together to deliver real-time stress insights
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {components.map((component, index) => (
              <Card
                key={index}
                className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-sky-600/10 dark:bg-sky-400/10 rounded-xl flex items-center justify-center mb-4">
                    {component.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {component.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {component.description}
                  </p>
                  <ul className="space-y-2">
                    {component.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                      >
                        <CheckCircle className="w-3 h-3 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 mb-4">
              Data Pipeline
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Data Flow Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              How data travels from your sensors to actionable stress insights
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
              <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-sky-600/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Cpu className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="text-slate-900 dark:text-white font-semibold text-sm">ESP32 Sensors</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">Real-time Data</div>
                </CardContent>
              </Card>
              <div className="text-sky-400 text-center text-3xl font-light hidden md:block">→</div>
              <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-cyan-600/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Wifi className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="text-slate-900 dark:text-white font-semibold text-sm">Supabase API</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">Data Storage</div>
                </CardContent>
              </Card>
              <div className="text-sky-400 text-center text-3xl font-light hidden md:block">→</div>
              <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 bg-sky-600/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="text-slate-900 dark:text-white font-semibold text-sm">AI Processing</div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mt-1">Stress Analysis</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="bg-white/30 dark:bg-slate-800/30 py-20 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 mb-4">
              Get Started
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Setup Guide
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Follow these four steps to get your stress monitoring system up and running
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {setupSteps.map((step, index) => (
              <Card
                key={index}
                className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 ml-16">
                    {step.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-sky-500 rounded-full flex-shrink-0" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ESP32 Connection Guide */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30 mb-4">
              Hardware
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              <Cpu className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              ESP32 Connection Guide
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Hardware Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg font-mono text-sm space-y-2">
                  <div><span className="text-sky-600 dark:text-sky-400">PPG Sensor:</span><span className="text-slate-700 dark:text-slate-300"> A0 (Analog)</span></div>
                  <div><span className="text-cyan-600 dark:text-cyan-400">DS18B20:</span><span className="text-slate-700 dark:text-slate-300"> D2 (Digital)</span></div>
                  <div><span className="text-teal-600 dark:text-teal-400">GSR Sensor:</span><span className="text-slate-700 dark:text-slate-300"> A1 (Analog)</span></div>
                  <div><span className="text-slate-500 dark:text-slate-400">LED Status:</span><span className="text-slate-700 dark:text-slate-300"> D13 (Built-in)</span></div>
                  <div><span className="text-rose-500">Power:</span><span className="text-slate-700 dark:text-slate-300"> 3.3V / 5V</span></div>
                  <div><span className="text-slate-400">Ground:</span><span className="text-slate-700 dark:text-slate-300"> GND</span></div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Arduino Code Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
{`#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverURL = "YOUR_SUPABASE_URL";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  // Initialize sensors
}

void loop() {
  // Read sensors and send data
  sendSensorData();
  delay(1000);
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Configuration */}
      <section className="bg-white/30 dark:bg-slate-800/30 py-20 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 mb-4">
              Configuration
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              <Settings className="w-8 h-8 text-sky-600 dark:text-sky-400" />
              API Configuration
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Required API Keys
              </h3>
              <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">OpenAI API Key</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                    Required for the AI chatbot functionality
                  </p>
                  <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30">
                    Add in Supabase Edge Function Secrets
                  </Badge>
                </CardContent>
              </Card>
              <Card className="bg-white/50 dark:bg-slate-800/50 border-sky-200 dark:border-slate-700">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="font-semibold text-slate-900 dark:text-white">Hugging Face (Optional)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                    For enhanced emotion detection models
                  </p>
                  <Badge className="bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                    Browser-based processing available
                  </Badge>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Configuration Steps
              </h3>
              <div className="space-y-4">
                {[
                  { n: 1, title: "Go to Supabase Dashboard", desc: "Navigate to Edge Functions → Secrets" },
                  { n: 2, title: "Add OPENAI_API_KEY", desc: "Get your API key from platform.openai.com" },
                  { n: 3, title: "Test Connection", desc: "Use the chatbot to verify setup" },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {item.n}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-white font-medium">{item.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-sky-600/20 to-cyan-400/20 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Set up your StressGuard AI system and start monitoring stress in real-time
          </p>
          <Link to="/signup">
            <Button className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-4 text-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900 py-12 transition-colors duration-300">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  StressGuard AI
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                © 2025 StressGuard AI. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Technology</h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div>AI & Machine Learning</div>
                <div>Biometric Sensors</div>
                <div>Real-time Processing</div>
                <div>Facial Recognition</div>
              </div>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Research</h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div>WESAD Dataset</div>
                <div>Clinical Validation</div>
                <div>Peer Review</div>
                <div>Technical Reports</div>
              </div>
            </div>
            <div>
              <h4 className="text-slate-900 dark:text-white font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div>Thapar University</div>
                <div>Research Team</div>
                <div>Technical Support</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorksPage;
