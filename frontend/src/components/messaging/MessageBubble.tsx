import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMessage } from '@domaris/types';

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showTime?: boolean;
}

const StatusIcon = ({ status, className }: { status: string; className?: string }) => {
  switch (status) {
    case 'sending': return <Clock className={cn("w-3 h-3 text-white/70", className)} />;
    case 'sent': return <Check className={cn("w-3 h-3 text-white/70", className)} />;
    case 'delivered': return <CheckCheck className={cn("w-3 h-3 text-white/70", className)} />;
    case 'read': return <CheckCheck className={cn("w-3 h-3 text-blue-200", className)} />; // distinct color for read
    case 'failed': return <AlertCircle className={cn("w-3 h-3 text-red-300", className)} />;
    default: return null;
  }
};

export function MessageBubble({ message, isOwn, showTime = true }: MessageBubbleProps) {
  
  const formattedTime = new Date(message.sentAt).toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatus = () => {
      if (message.readAt) return 'read';
      if (message.deliveredAt) return 'delivered';
      return 'sent';
  };

  if (message.type === 'SYSTEM' as any) { // Casting or assuming uppercase based on Enumconvention usually
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full mb-2", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2 relative group shadow-sm",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-white border text-foreground rounded-bl-sm"
        )}
      >
        {/* VIEWING REQUEST CARD */}
        {message.type === 'VIEWING_REQUEST' as any ? (
           <div className="bg-white/10 p-3 rounded-lg border border-white/20 mb-1 backdrop-blur-sm">
             <div className="flex items-center gap-2 mb-2 font-semibold">
                <Calendar className="w-4 h-4" />
                <span>Cerere Vizionare</span>
             </div>
             <p className="text-sm opacity-90">{message.text}</p>
           </div>
        ) : message.type === 'IMAGE' as any ? (
           <div className="mb-1">
             <img 
               src={message.mediaUrl || message.text} 
               alt="Attachment" 
               className="rounded-lg max-w-full md:max-w-xs object-cover"
             />
           </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {showTime && (
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1 text-[10px]",
             isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span>{formattedTime}</span>
            {isOwn && <StatusIcon status={getStatus()} />}
          </div>
        )}
      </div>
    </div>
  );
}
