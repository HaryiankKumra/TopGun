
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Message } from "@/types/chat";
import { getLocalStressRecommendations } from "@/utils/stressRecommendations";
import ChatMessage from "./chat/ChatMessage";
import TypingIndicator from "./chat/TypingIndicator";
import ChatInput from "./chat/ChatInput";
import QuickActions from "./chat/QuickActions";

const StressChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hi! I'm your AI stress management assistant. 🤖 I'm here to help you with relaxation techniques, breathing exercises, and personalized stress relief strategies.\n\nHow are you feeling right now? You can also use the quick action buttons below to get started.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      console.log("🔄 Sending message to chatbot...");

      const { data, error } = await supabase.functions.invoke("stress-chatbot", {
        body: { message: inputValue },
      });

      if (error) {
        console.error("❌ Supabase function error:", error);
        throw error;
      }

      if (data?.response) {
        console.log("✅ Received AI response");
        setIsConnected(true);
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("No response received from chatbot");
      }
    } catch (apiError) {
      console.warn("⚠️ AI chatbot error, using local responses:", apiError);
      setIsConnected(false);

      // Enhanced local responses
      const recommendation = getLocalStressRecommendations(inputValue);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: recommendation.response + "\n\n💡 *Note: Using offline responses. Check your connection or API configuration for full AI features.*",
        timestamp: new Date(),
        stressLevel: recommendation.stressLevel,
      };
      setMessages((prev) => [...prev, botMessage]);

      // Show connectivity toast
      toast({
        title: "Using Offline Mode",
        description: "AI chatbot is unavailable. Using local stress management responses.",
        variant: "default",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (message: string) => {
    setInputValue(message);
    // Auto-send quick actions
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <Card className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span>AI Stress Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-orange-500" />
            )}
            <Badge className={`${
              isConnected 
                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {isConnected ? "🤖 AI Active" : "📱 Offline Mode"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-96">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-gray-50/50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-600">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="space-y-3">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
            />

            {/* Quick Actions */}
            <QuickActions onQuickAction={handleQuickAction} />
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          {isConnected ? (
            <span className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              AI powered stress management chat
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
              Local stress management responses
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StressChatbot;
