
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Bot, User, Sparkles, Heart, Brain, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  stressLevel?: string;
  recommendations?: string[];
}

const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI stress management assistant. I can help you with breathing exercises, stress relief techniques, and personalized wellness advice. How are you feeling today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingData, setIsSendingData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Save user message to database
      if (user) {
        await supabase.from('chat_history').insert({
          user_id: user.id,
          message: messageToSend,
          is_user: true,
          session_id: crypto.randomUUID(),
        });
      }

      // Fetch latest health context
      let healthContext = null;
      if (user) {
        try {
          // Get latest biometric reading (cast to any to bypass type issues)
          const { data: biometricData } = await (supabase as any)
            .from('biometric_data_enhanced')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

          // Get user profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('medical_conditions, medications')
            .eq('user_id', user.id)
            .maybeSingle();

          if (biometricData && biometricData.length > 0) {
            const latest = biometricData[0] as any;
            // Calculate recent trend
            let recentTrend = 'stable';
            if (biometricData.length >= 3) {
              const avgRecent = biometricData.slice(0, 3).reduce((sum: number, d: any) => sum + (d.stress_score || 0), 0) / 3;
              const avgOlder = biometricData.slice(-2).reduce((sum: number, d: any) => sum + (d.stress_score || 0), 0) / (biometricData.length > 3 ? 2 : biometricData.length);
              if (avgRecent > avgOlder + 10) recentTrend = 'increasing';
              else if (avgRecent < avgOlder - 10) recentTrend = 'decreasing';
            }

            healthContext = {
              heartRate: latest.heart_rate,
              stressScore: latest.stress_score,
              facialEmotion: latest.facial_emotion || 'unknown',
              facialConfidence: latest.facial_confidence ? Math.round(latest.facial_confidence * 100) : null,
              wearableStress: latest.wearable_stress_score,
              fusionStress: latest.fusion_stress_score,
              temperature: latest.temperature,
              spo2: latest.spo2,
              eda: latest.gsr_value,
              healthConditions: profileData?.medical_conditions?.join(', ') || 'None',
              medications: profileData?.medications?.join(', ') || 'None',
              recentTrend: recentTrend
            };
            console.log('📊 Health context loaded:', healthContext);
          } else {
            console.log('📊 No biometric data found for user');
          }
        } catch (e) {
          console.warn('Could not fetch health context:', e);
        }
      }

      // Call AI chatbot function with health context
      console.log('🤖 Calling stress-chatbot Edge Function with message:', messageToSend);
      console.log('📊 Sending health context to AI:', healthContext);
      
      const { data, error } = await supabase.functions.invoke('stress-chatbot', {
        body: { message: messageToSend, healthContext }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      console.log('✅ Chatbot response received:', data);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help with your stress management. Could you tell me more about what you're experiencing?",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      if (user) {
        await supabase.from('chat_history').insert({
          user_id: user.id,
          message: aiMessage.content,
          is_user: false,
          session_id: crypto.randomUUID(),
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble responding right now. Here are some quick stress relief techniques: Take 5 deep breaths, try progressive muscle relaxation, or practice mindfulness for a few minutes.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendHealthData = async () => {
    if (!user || isSendingData) return;

    setIsSendingData(true);

    try {
      // Fetch latest 10 biometric readings (cast to any to bypass type issues)
      const { data: biometricData, error: biometricError } = await (supabase as any)
        .from('biometric_data_enhanced')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch user profile with health conditions
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (biometricError || profileError) {
        throw new Error('Failed to fetch health data');
      }

      // Create a comprehensive health summary
      const healthSummary = `Here is my recent health data for analysis:

**Recent Biometric Readings (Last 10):**
${biometricData?.map((reading: any, index: number) => 
  `${index + 1}. Heart Rate: ${reading.heart_rate || 'N/A'} BPM, Stress: ${reading.stress_score || 'N/A'}%, Facial: ${reading.facial_emotion || 'N/A'}, Temp: ${reading.temperature || 'N/A'}°C, EDA: ${reading.gsr_value || 'N/A'}Ω (${new Date(reading.created_at).toLocaleString()})`
).join('\n') || 'No recent readings available'}

**Health Profile:**
- Medical Conditions: ${profileData?.medical_conditions?.join(', ') || 'None specified'}
- Current Medications: ${profileData?.medications?.join(', ') || 'None specified'}
- Allergies: ${profileData?.allergies?.join(', ') || 'None specified'}
- Age: ${profileData?.age || 'Not specified'}
- Activity Level: ${profileData?.activity_level || 'Not specified'}
- Stress Thresholds: Low: ${profileData?.stress_threshold_low || 30}%, Medium: ${profileData?.stress_threshold_medium || 60}%, High: ${profileData?.stress_threshold_high || 80}%

Please analyze this data and explain why I might be experiencing stress based on my physiological readings and health conditions. Provide personalized recommendations for stress management considering my specific health profile.`;

      // Send the health summary to AI
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "📊 Sending my health data for personalized analysis...",
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      const { data, error } = await supabase.functions.invoke('stress-chatbot', {
        body: { message: healthSummary }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Based on your health data, I can see patterns in your stress levels. Let me provide some personalized recommendations...",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      toast({
        title: "Health Data Sent",
        description: "Your physiological readings and health profile have been analyzed by AI.",
      });

    } catch (error) {
      console.error('Health data error:', error);
      toast({
        title: "Error",
        description: "Failed to send health data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingData(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "I'm feeling stressed at work",
    "Help me with breathing exercises",
    "I need relaxation techniques",
    "How to manage anxiety?",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
              <Bot className="w-6 lg:w-8 h-6 lg:h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300">Your personal stress management companion</p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg lg:text-xl">
                  <MessageCircle className="w-5 h-5 text-purple-500" />
                  Chat with AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-80 lg:h-96 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isUser
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.isUser && (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-slate-700 px-4 py-2 rounded-lg rounded-bl-none">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <Button
                      onClick={handleSendHealthData}
                      disabled={isSendingData || !user}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full sm:w-auto"
                      size="sm"
                    >
                      {isSendingData ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Activity className="w-4 h-4 mr-2" />
                      )}
                      {isSendingData ? 'Analyzing...' : 'Analyze My Health Data'}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me about stress management, breathing exercises, or wellness tips..."
                      className="flex-1 min-h-[40px] max-h-32 resize-none text-sm"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-blue-500 hover:bg-blue-600 px-3 lg:px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader className="p-4">
                <CardTitle className="text-sm lg:text-base text-gray-900 dark:text-white">Quick Prompts</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto py-2 px-3 text-xs lg:text-sm whitespace-normal"
                    onClick={() => setInputValue(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700">
              <CardHeader className="p-4">
                <CardTitle className="text-sm lg:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Wellness Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2 text-xs lg:text-sm text-gray-600 dark:text-gray-300">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="font-medium text-blue-800 dark:text-blue-300 text-xs lg:text-sm">4-7-8 Breathing</p>
                  <p className="text-xs">Inhale 4s, hold 7s, exhale 8s</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="font-medium text-green-800 dark:text-green-300 text-xs lg:text-sm">Progressive Relaxation</p>
                  <p className="text-xs">Tense and release muscle groups</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="font-medium text-purple-800 dark:text-purple-300 text-xs lg:text-sm">Mindfulness</p>
                  <p className="text-xs">Focus on present moment awareness</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
