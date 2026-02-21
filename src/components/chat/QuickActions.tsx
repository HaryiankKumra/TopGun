
import React from 'react';
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onQuickAction: (message: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onQuickAction }) => {
  const quickActions = [
    { emoji: "😰", text: "I'm stressed", message: "I'm feeling stressed" },
    { emoji: "🫁", text: "Breathing help", message: "I need breathing exercises" },
    { emoji: "😴", text: "Sleep issues", message: "I can't sleep" },
    { emoji: "💼", text: "Work stress", message: "Work is overwhelming" },
  ];

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {quickActions.map((action, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onQuickAction(action.message)}
          className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500 transition-all duration-200"
        >
          {action.emoji} {action.text}
        </Button>
      ))}
    </div>
  );
};

export default QuickActions;
