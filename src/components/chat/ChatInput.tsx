
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  setInputValue,
  onSendMessage,
  onKeyPress,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={disabled ? "AI is thinking..." : "Ask me about stress management, breathing exercises, or relaxation techniques..."}
        disabled={disabled}
        className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-400 dark:focus:border-purple-400 transition-colors"
        rows={1}
      />
      <Button
        onClick={onSendMessage}
        disabled={!inputValue.trim() || disabled}
        className="h-11 px-4 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default ChatInput;
