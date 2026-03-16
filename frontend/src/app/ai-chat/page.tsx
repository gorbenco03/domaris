"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, PanelLeftClose, PanelLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  AIChatMessage,
  AIChatInput,
  AIChatSidebar,
  AIChatTypingIndicator,
  AIMessage,
  AIConversation,
  PropertyResult,
  QuickAction,
} from "@/components/ai-chat";
import {
  getAIConversations,
  getAIActiveConversation,
  getAIConversation,
  createAIConversation,
  sendAIConversationMessage,
  type AIConversationDetail as ApiConversationDetail,
  type AIConversationSummary as ApiConversationSummary,
  type AIMessage as ApiConversationMessage,
  type PropertySuggestion,
} from "@/lib/aiApi";
import { cn } from "@/lib/utils";

const AI_ANONYMOUS_ID_KEY = "riva_ai_anonymous_id";
const PHASE_LABELS: Record<string, string> = {
  discovery: "Descoperire",
  ready_to_search: "Gata de căutare",
  results_shown: "Rezultate afișate",
  refining: "Rafinare",
  property_followup: "Follow-up proprietate",
};

const getOrCreateAnonymousId = () => {
  if (typeof window === "undefined") return undefined;

  const existing = window.localStorage.getItem(AI_ANONYMOUS_ID_KEY);
  if (existing) return existing;

  const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  window.localStorage.setItem(AI_ANONYMOUS_ID_KEY, next);
  return next;
};

export default function AIChatPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [activeConversationPhase, setActiveConversationPhase] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anonymousIdRef = useRef<string | undefined>(undefined);

  const mapProperties = useCallback((properties?: PropertySuggestion[]): PropertyResult[] | undefined => {
    return properties?.map((property) => ({
      id: property.id,
      title: property.title,
      price: `${(property.priceEur ?? 0).toLocaleString()}€`,
      priceType: property.transactionType === "RENT" ? "rent" : "sale",
      location: `${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ""}`,
      rooms: property.rooms,
      area: property.surfaceSqm,
      image: property.imageUrl,
      score:
        property.matchScore !== undefined
          ? Math.max(1, Math.min(10, Math.round(property.matchScore / 10)))
          : undefined,
      reasons: property.matchReasons,
    }));
  }, []);

  const mapQuickActions = useCallback(
    (
      actions?: Array<{
        label: string;
        payload?: Record<string, unknown>;
      }>
    ): QuickAction[] | undefined =>
      actions?.map((action) => ({
        label: action.label,
        action:
          typeof action.payload?.message === "string"
            ? (action.payload.message as string)
            : action.label,
      })),
    []
  );

  const mapConversationMessage = useCallback(
    (message: ApiConversationMessage): AIMessage => ({
      id: String(message.id),
      role: message.role === "user" ? "user" : "assistant",
      content: message.content,
      timestamp: new Date(message.createdAt),
      conversationPhase: message.metadata?.conversationPhase,
      properties: mapProperties(message.metadata?.propertyCards),
      quickActions: mapQuickActions(message.metadata?.suggestedActions),
    }),
    [mapProperties, mapQuickActions]
  );

  const toConversationSummary = useCallback(
    (conversation: ApiConversationSummary | ApiConversationDetail): AIConversation => ({
      id: conversation.id,
      title: conversation.title || "Conversație nouă",
      lastMessage: "lastMessage" in conversation ? conversation.lastMessage?.content || "" : "",
      updatedAt: conversation.lastMessageAt || conversation.createdAt,
      messageCount: conversation.messageCount || 0,
    }),
    []
  );

  const upsertConversation = useCallback((conversation: AIConversation) => {
    setConversations((prev) => {
      const next = prev.filter((item) => item.id !== conversation.id);
      return [conversation, ...next];
    });
  }, []);

  useEffect(() => {
    const loadInitialState = async () => {
      const anonymousId = getOrCreateAnonymousId();
      anonymousIdRef.current = anonymousId;

      try {
        const result = await getAIConversations();
        setConversations(result.data.map(toConversationSummary));
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }

      try {
        const activeConversation = await getAIActiveConversation(anonymousId);
        setActiveConvId(activeConversation.id);
        setMessages(activeConversation.messages.map(mapConversationMessage));
        setActiveConversationPhase(activeConversation.clientProfile?.conversationPhase);
        upsertConversation(toConversationSummary(activeConversation));
      } catch (err) {
        console.error("Failed to load active conversation:", err);
      }
    };

    void loadInitialState();
  }, [mapConversationMessage, toConversationSummary, upsertConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const createConversationAndLoad = useCallback(async () => {
    const anonymousId = anonymousIdRef.current || getOrCreateAnonymousId();
    anonymousIdRef.current = anonymousId;

    const conversation = await createAIConversation(anonymousId);
    setActiveConvId(conversation.id);
    setMessages(conversation.messages.map(mapConversationMessage));
    setActiveConversationPhase(conversation.clientProfile?.conversationPhase);
    upsertConversation(toConversationSummary(conversation));
    return conversation.id;
  }, [mapConversationMessage, toConversationSummary, upsertConversation]);

  const handleSend = useCallback(
    async (content: string) => {
      setIsLoading(true);

      let conversationId = activeConvId;

      try {
        if (!conversationId) {
          conversationId = await createConversationAndLoad();
        }

        const tempUserMsg: AIMessage = {
          id: `temp-${Date.now()}`,
          role: "user",
          content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, tempUserMsg]);

        const response = await sendAIConversationMessage(conversationId, content);

        const assistantMessage: AIMessage = {
          id: String(response.assistantMessage.id),
          role: "assistant",
          content: response.assistantMessage.content,
          timestamp: new Date(response.assistantMessage.createdAt),
          conversationPhase:
            response.clientProfile?.conversationPhase
            || response.assistantMessage.metadata?.conversationPhase,
          properties: mapProperties(
            response.properties || response.assistantMessage.metadata?.propertyCards
          ),
          quickActions: mapQuickActions(
            response.suggestedActions || response.assistantMessage.metadata?.suggestedActions
          ),
        };

        setMessages((prev) => {
          const withoutTemp = prev.filter((message) => message.id !== tempUserMsg.id);
          return [
            ...withoutTemp,
            {
              id: String(response.userMessage.id),
              role: "user",
              content: response.userMessage.content,
              timestamp: new Date(response.userMessage.createdAt),
            },
            assistantMessage,
          ];
        });
        setActiveConversationPhase(
          response.clientProfile?.conversationPhase
          || response.assistantMessage.metadata?.conversationPhase
        );

        upsertConversation({
          id: conversationId,
          title: conversations.find((item) => item.id === conversationId)?.title
            || (content.length > 40 ? `${content.slice(0, 40)}...` : content),
          lastMessage: response.assistantMessage.content.slice(0, 100),
          updatedAt: response.assistantMessage.createdAt,
          messageCount:
            (conversations.find((item) => item.id === conversationId)?.messageCount || 0) + 2,
        });
      } catch (err) {
        console.error("AI Chat error:", err);
        setMessages((prev) => [
          ...prev.filter((message) => !message.id.startsWith("temp-")),
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Îmi pare rău, a apărut o eroare. Te rog să încerci din nou.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConvId, conversations, createConversationAndLoad, mapProperties, mapQuickActions, upsertConversation]
  );

  const handleQuickAction = useCallback((action: string) => {
    void handleSend(action);
  }, [handleSend]);

  const handleNewChat = useCallback(() => {
    setIsLoading(true);

    const run = async () => {
      try {
        await createConversationAndLoad();
      } catch (err) {
        console.error("Failed to create conversation:", err);
        setActiveConvId(null);
        setActiveConversationPhase(undefined);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [createConversationAndLoad]);

  const handleSelectConversation = useCallback(async (id: number) => {
    setActiveConvId(id);
    setIsLoading(true);

    try {
      const conversation = await getAIConversation(id);
      setMessages(conversation.messages.map(mapConversationMessage));
      setActiveConversationPhase(conversation.clientProfile?.conversationPhase);
      upsertConversation(toConversationSummary(conversation));
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setActiveConversationPhase(undefined);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapConversationMessage, toConversationSummary, upsertConversation]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "hidden transition-all duration-300 md:block",
            sidebarOpen ? "w-72" : "w-0"
          )}
        >
          {sidebarOpen && (
            <AIChatSidebar
              conversations={conversations}
              activeId={activeConvId}
              onSelect={handleSelectConversation}
              onNewChat={handleNewChat}
            />
          )}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 md:flex"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">RIVA AI</h1>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="text-[10px] text-muted-foreground">Asistent imobiliar inteligent</p>
                  {activeConversationPhase && (
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {PHASE_LABELS[activeConversationPhase] || activeConversationPhase}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {messages.length === 0 ? (
                <EmptyState onQuickAction={handleQuickAction} />
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <AIChatMessage
                      key={message.id}
                      message={message}
                      onQuickAction={handleQuickAction}
                      isLatest={index === messages.length - 1 && message.role === "assistant"}
                    />
                  ))}
                  {isLoading && <AIChatTypingIndicator />}
                </div>
              )}
            </div>
          </div>

          <AIChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

// Empty state with welcome message and starter prompts
const EmptyState = ({ onQuickAction }: { onQuickAction: (action: string) => void }) => {
  const starters = [
    {
      emoji: "🔍",
      title: "Caută proprietăți",
      description: "Descrie ce cauți și găsesc opțiuni pentru tine",
      action: "Caut un apartament cu 2 camere în București sub 500€",
    },
    {
      emoji: "💰",
      title: "Evaluare proprietate",
      description: "Află valoarea de piață a proprietății tale",
      action: "Cât valorează un apartament de 3 camere, 75m² în Floreasca?",
    },
    {
      emoji: "✍️",
      title: "Generează descriere",
      description: "Creez texte profesionale pentru anunțul tău",
      action: "Generează o descriere pentru un apartament de 2 camere în Centru",
    },
    {
      emoji: "📊",
      title: "Analizează anunț",
      description: "Primește un scor și sfaturi de îmbunătățire",
      action: "Analizează anunțul meu și dă-mi un scor cu sugestii",
    },
  ];

  return (
    <div className="flex flex-col items-center pt-8 pb-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Bot className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-1 text-xl font-bold text-foreground">Bun venit la RIVA AI</h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        Sunt asistentul tău imobiliar inteligent. Te ajut să cauți proprietăți, estimezi prețuri și
        optimizezi anunțuri.
      </p>

      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s.title}
            onClick={() => onQuickAction(s.action)}
            className="group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-accent hover:shadow-md"
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-sm font-semibold text-foreground group-hover:text-accent">
              {s.title}
            </span>
            <span className="text-xs text-muted-foreground">{s.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
