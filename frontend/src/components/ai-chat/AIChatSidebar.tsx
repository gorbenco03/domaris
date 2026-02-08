"use client";

import { Plus, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AIConversation {
  id: number;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messageCount: number;
}

interface AIChatSidebarProps {
  conversations: AIConversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNewChat: () => void;
}

export const AIChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: AIChatSidebarProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Ieri";
    if (days < 7) return `Acum ${days} zile`;
    return date.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Conversații AI</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length > 0 ? (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "mb-1 flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors",
                activeId === conv.id
                  ? "bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-sm font-medium line-clamp-1">{conv.title}</span>
              <span className="text-xs line-clamp-1 opacity-70">{conv.lastMessage}</span>
              <div className="flex items-center gap-1 text-[10px] opacity-50">
                <Clock className="h-3 w-3" />
                {formatDate(conv.updatedAt)}
                <span className="ml-auto">{conv.messageCount} mesaje</span>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">Nicio conversație</p>
          </div>
        )}
      </div>
    </div>
  );
};
