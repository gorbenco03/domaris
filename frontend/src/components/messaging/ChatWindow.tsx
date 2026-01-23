"use client";

import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { IMessage } from '@domaris/types';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  messages: IMessage[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatWindow({ messages, currentUserId, onSendMessage, isLoading, className }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex flex-col h-full bg-slate-50", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <p>Niciun mesaj încă.</p>
                <p className="text-sm">Începe conversația!</p>
            </div>
        ) : (
            messages.map((msg, index) => {
                const isOwn = String(msg.senderId) === String(currentUserId);
                // Simple date separator logic could go here
                return (
                    <MessageBubble 
                        key={msg.id || index} 
                        message={msg} 
                        isOwn={isOwn} 
                    />
                );
            })
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
