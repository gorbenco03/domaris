import React, { useState, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="p-4 border-t bg-white">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        {/* Attachments (Mock for now) */}
        <div className="flex gap-1 pb-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0" disabled={disabled}>
                <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground shrink-0" disabled={disabled}>
                <ImageIcon className="w-5 h-5" />
            </Button>
        </div>

        <div className="flex-1 relative">
            <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Scrie un mesaj..."
                className="min-h-[44px] max-h-[120px] py-3 pr-10 resize-none rounded-xl"
                disabled={disabled}
                rows={1}
            />
            {/* Emoji or other inline actions could go here */}
        </div>

        <Button 
            onClick={handleSend} 
            disabled={!message.trim() || disabled}
            size="icon"
            className={cn("shrink-0 rounded-full h-11 w-11 transition-all", message.trim() ? "scale-100" : "scale-95 opacity-80")}
        >
            <Send className="w-5 h-5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
