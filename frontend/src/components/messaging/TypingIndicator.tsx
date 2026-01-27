'use client';

/**
 * Typing Indicator Component
 * Animated typing indicator with three bouncing dots
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  visible: boolean;
  className?: string;
}

export function TypingIndicator({ visible, className }: TypingIndicatorProps) {
  if (!visible) return null;

  return (
    <div className={cn('px-4 py-1 flex justify-start', className)}>
      <div className="flex items-center gap-1 px-4 py-3 bg-white border rounded-2xl rounded-bl-sm">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default TypingIndicator;
