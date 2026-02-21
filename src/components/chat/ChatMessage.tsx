
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Bot, User } from "lucide-react";
import { Message } from "@/types/chat";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getStressLevelColor = (level?: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 ${
        message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div className={`p-2 rounded-full ${
        message.type === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-purple-600 text-white'
      }`}>
        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={`max-w-xs lg:max-w-md ${
        message.type === 'user' ? 'text-right' : 'text-left'
      }`}>
        <div className={`p-3 rounded-lg ${
          message.type === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 border border-slate-600 text-white'
        }`}>
          <p className="whitespace-pre-line">{message.content}</p>
          {message.stressLevel && (
            <Badge className={`mt-2 ${getStressLevelColor(message.stressLevel)} border`}>
              Stress Level: {message.stressLevel}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
