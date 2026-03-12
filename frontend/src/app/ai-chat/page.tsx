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
  QuickAction
} from "@/components/ai-chat";
import { 
  agentChat, 
  getAIConversations, 
  getAIConversation,
  createAIConversation,
  sendAIConversationMessage 
} from "@/lib/aiApi";
import { cn } from "@/lib/utils";

export default function AIChatPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const result = await getAIConversations();
        const mapped = result.data.map(c => ({
          id: c.id,
          title: c.title,
          lastMessage: "",
          updatedAt: c.lastMessageAt || c.createdAt,
          messageCount: c.messageCount || 0
        }));
        setConversations(mapped);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (content: string) => {
      const userMsg: AIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        if (activeConvId) {
          // Use persistent conversation
          const response = await sendAIConversationMessage(activeConvId, content);
          
          const properties: PropertyResult[] | undefined = response.properties?.map(p => ({
            id: p.id,
            title: p.title,
            price: `${(p.priceEur ?? 0).toLocaleString()}€`,
            priceType: p.transactionType === 'RENT' ? 'rent' : 'sale',
            location: `${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}`,
            rooms: p.rooms,
            area: p.surfaceSqm,
            image: p.imageUrl
          }));

          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.assistantMessage.content,
            timestamp: new Date(response.assistantMessage.createdAt),
            properties,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // Use stateless agent chat
          const response = await agentChat({ message: content });
          
          const properties: PropertyResult[] | undefined = response.properties?.map(p => ({
            id: p.id,
            title: p.title,
            price: `${(p.priceEur ?? 0).toLocaleString()}€`,
            priceType: p.transactionType === 'RENT' ? 'rent' : 'sale',
            location: `${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}`,
            rooms: p.rooms,
            area: p.surfaceSqm,
            image: p.imageUrl
          }));

          const quickActions: QuickAction[] | undefined = response.suggestedActions?.map(a => ({
            label: a.label,
            action: a.label
          }));

          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
            properties,
            quickActions,
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Create new conversation if this is first message
          if (messages.length === 0) {
            try {
              const newConv = await createAIConversation();
              const mapped: AIConversation = {
                id: newConv.id,
                title: content.length > 40 ? content.slice(0, 40) + "..." : content,
                lastMessage: response.message.slice(0, 50) + "...",
                updatedAt: newConv.createdAt,
                messageCount: 2,
              };
              setConversations((prev) => [mapped, ...prev]);
              setActiveConvId(newConv.id);
            } catch {
              // Conversation creation failed, continue without persistence
            }
          }
        }
      } catch (err) {
        console.error("AI Chat error:", err);
        setMessages((prev) => [
          ...prev,
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
    [messages, activeConvId]
  );

  const handleQuickAction = useCallback(
    (action: string) => {
      handleSend(action);
    },
    [handleSend]
  );

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConversation = async (id: number) => {
    setActiveConvId(id);
    setIsLoading(true);
    
    try {
      const conv = await getAIConversation(id);
      const mapped: AIMessage[] = conv.messages.map(m => ({
        id: String(m.id),
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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

        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 md:flex"
              onClick={() => setSidebarOpen((v) => !v)}
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
                <p className="text-[10px] text-muted-foreground">Asistent imobiliar inteligent</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6">
              {messages.length === 0 ? (
                <EmptyState onQuickAction={handleQuickAction} />
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, i) => (
                    <AIChatMessage
                      key={msg.id}
                      message={msg}
                      onQuickAction={handleQuickAction}
                      isLatest={i === messages.length - 1 && msg.role === "assistant"}
                    />
                  ))}
                  {isLoading && <AIChatTypingIndicator />}
                </div>
              )}
            </div>
          </div>

          {/* Input */}
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
