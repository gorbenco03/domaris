"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, PanelLeftClose, PanelLeft, Sparkles, Search, TrendingUp, Home, GitCompareArrows } from "lucide-react";
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
  ValuationResult,
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

/**
 * Try to extract valuation data from a backend response metadata object.
 * The backend stores the AVM result in assistantMessage.metadata or can surface
 * it through the valuation tools response embedded in the message.
 */
function extractValuation(
  metadata?: Record<string, unknown>
): ValuationResult | undefined {
  if (!metadata) return undefined;

  // Check if backend stored an AVM result directly in metadata
  const avm = metadata.avm as Record<string, unknown> | undefined;
  const valuation = (metadata.valuation ?? avm) as Record<string, unknown> | undefined;

  if (!valuation) return undefined;

  const recommendedPrice =
    typeof valuation.recommendedPrice === "number" ? valuation.recommendedPrice : undefined;
  const priceRange = valuation.priceRange as { min: number; max: number } | undefined;

  if (!recommendedPrice || !priceRange) return undefined;
  if (recommendedPrice <= 0) return undefined; // insufficient data marker

  const result: ValuationResult = {
    estimatedPrice: recommendedPrice,
    priceRange,
    confidence:
      typeof valuation.confidence === "number" ? valuation.confidence : 0.5,
    comparables: (valuation.comparables as ValuationResult["comparables"]) ?? [],
    currency: typeof valuation.currency === "string" ? valuation.currency : "EUR",
    liquidityScore:
      typeof valuation.liquidityScore === "number" ? valuation.liquidityScore : undefined,
    dealAttractivenessScore:
      typeof valuation.dealAttractivenessScore === "number"
        ? valuation.dealAttractivenessScore
        : undefined,
    insufficientData: valuation.insufficientData === true,
  };

  // Attach explanation if present at top level of metadata
  const explanation = metadata.explanation as ValuationResult["explanation"] | undefined;
  if (explanation) result.explanation = explanation;

  return result;
}

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
      valuation: extractValuation(message.metadata as Record<string, unknown> | undefined),
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

        // Extract valuation from response metadata if present
        const valuation =
          extractValuation(
            response.assistantMessage.metadata as Record<string, unknown> | undefined
          ) ??
          // Also check top-level response (some endpoints wrap it differently)
          undefined;

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
          valuation,
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

  /**
   * Called from AIChatPropertyCard when the user clicks "Programează vizionare".
   * Pre-fills a chat message that triggers the schedule_viewing tool.
   */
  const handleScheduleViewing = useCallback(
    (propertyId: number, propertyTitle: string) => {
      const message = `Vreau să programez o vizionare pentru proprietatea "${propertyTitle}" (ID: ${propertyId})`;
      void handleSend(message);
    },
    [handleSend]
  );

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
                  <p className="text-[10px] text-muted-foreground">Asistent imobiliar personal</p>
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
                      onScheduleViewing={handleScheduleViewing}
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

// ---------------------------------------------------------------------------
// Empty state with personal-assistant tone and guided prompts
// ---------------------------------------------------------------------------

const STARTER_PROMPTS = [
  {
    icon: Search,
    title: "Caută proprietăți",
    description: "Spune-mi ce cauți și îți găsesc cele mai bune opțiuni",
    action: "Caut un apartament cu 2 camere în Botanica, sub 400€/lună",
  },
  {
    icon: TrendingUp,
    title: "Evaluează o proprietate",
    description: "Află cât valorează garsoniera sau apartamentul tău pe piață",
    action: "Cât valorează garsoniera mea de 40m² în Centru, Chișinău?",
  },
  {
    icon: GitCompareArrows,
    title: "Compară rezultate",
    description: "Analizez primele rezultate și îți spun care e mai avantajos",
    action: "Compară primele 2 rezultate și spune-mi care e mai bun raport calitate-preț",
  },
  {
    icon: Home,
    title: "Programează vizionare",
    description: "Organizez o vizionare la proprietatea care te interesează",
    action: "Vreau să programez o vizionare pentru un apartament în Botanica",
  },
];

const EmptyState = ({ onQuickAction }: { onQuickAction: (action: string) => void }) => {
  return (
    <div className="flex flex-col items-center pt-8 pb-4">
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-4 ring-primary/5">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      {/* Headline */}
      <h2 className="mb-2 text-xl font-bold text-foreground">
        Bună ziua! Sunt RIVA, asistentul tău imobiliar personal.
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
        Te ajut să găsești locuința perfectă, să afli prețul corect de piață sau să programezi
        vizionări — totul printr-o conversație naturală.
      </p>

      {/* Prompt cards */}
      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {STARTER_PROMPTS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              onClick={() => onQuickAction(s.action)}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                  {s.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.description}</span>
              </div>
              <p className="rounded-lg bg-muted px-3 py-2 text-xs italic text-muted-foreground line-clamp-2">
                &ldquo;{s.action}&rdquo;
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
