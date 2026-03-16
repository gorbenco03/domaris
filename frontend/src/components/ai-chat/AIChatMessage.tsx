"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIChatPropertyCard, PropertyResult } from "./AIChatPropertyCard";
import { AIChatValuationWidget, ValuationResult } from "./AIChatValuationWidget";
import { AIChatQuickActions, QuickAction } from "./AIChatQuickActions";

const phaseLabels: Record<string, string> = {
  discovery: "Descoperire",
  ready_to_search: "Gata de căutare",
  results_shown: "Rezultate afișate",
  refining: "Rafinare",
  property_followup: "Follow-up proprietate",
};

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  conversationPhase?: string;
  properties?: PropertyResult[];
  valuation?: ValuationResult;
  quickActions?: QuickAction[];
}

interface AIChatMessageProps {
  message: AIMessage;
  onQuickAction?: (action: string) => void;
  isLatest?: boolean;
}

export const AIChatMessage = ({ message, onQuickAction, isLatest }: AIChatMessageProps) => {
  const isUser = message.role === "user";

  // Simple markdown renderer for bold text
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Handle newlines
      return part.split("\n").map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[85%] flex-col gap-3", isUser ? "items-end" : "items-start")}>
        {/* Text bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "rounded-tr-md bg-accent text-accent-foreground"
              : "rounded-tl-md bg-card text-card-foreground border border-border"
          )}
        >
          {!isUser && message.conversationPhase && (
            <div className="mb-2 inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {phaseLabels[message.conversationPhase] || message.conversationPhase}
            </div>
          )}
          <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:mb-2 [&_p:last-child]:mb-0">
            {renderContent(message.content)}
          </div>
          <span
            className={cn(
              "mt-1.5 block text-[10px]",
              isUser ? "text-accent-foreground/60" : "text-muted-foreground"
            )}
          >
            {message.timestamp.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Property cards */}
        {message.properties && message.properties.length > 0 && (
          <div className="flex w-full gap-3 overflow-x-auto pb-2">
            {message.properties.map((property) => (
              <AIChatPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Valuation widget */}
        {message.valuation && (
          <AIChatValuationWidget valuation={message.valuation} />
        )}

        {/* Quick actions */}
        {message.quickActions && isLatest && (
          <AIChatQuickActions actions={message.quickActions} onAction={onQuickAction} />
        )}
      </div>
    </div>
  );
};
