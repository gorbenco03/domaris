"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Loader2, 
  Send, 
  MessageCircle,
  Home,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getConversation, 
  getMessages, 
  sendMessage,
  markAsRead,
  Conversation,
  Message 
} from "@/lib/messagingApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  
  // API state
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Message input
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchConversation = async () => {
      if (!isAuthenticated || !conversationId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [convData, messagesData] = await Promise.all([
          getConversation(conversationId),
          getMessages(conversationId),
        ]);
        
        setConversation(convData);
        setMessages(messagesData);
        
        // Mark as read
        markAsRead(conversationId).catch(() => {});
      } catch (err) {
        console.error("Failed to fetch conversation:", err);
        setError("Nu am putut încărca conversația");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchConversation();
    }
  }, [isAuthenticated, isAuthLoading, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);
    
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: Number(user?.id) || 0,
      content: messageContent,
      type: 'TEXT',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const sentMessage = await sendMessage(conversationId, messageContent);
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(m => m.id === tempMessage.id ? sentMessage : m)
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea mesajele.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center gap-4">
            <Link 
              href="/messages" 
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            {conversation && (
              <div className="flex flex-1 items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {(conversation.property?.image || (conversation.property as any)?.mainImage) ? (
                    <img
                      src={conversation.property?.image || (conversation.property as any)?.mainImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Home className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link 
                    href={`/property/${conversation.property?.id || ""}`}
                    className="block truncate font-medium hover:text-primary"
                  >
                    {conversation.property?.title || "Proprietate"}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.participants.length} participanți
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-border bg-card py-16 text-center">
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Încearcă din nou
                </Button>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message, idx) => {
                  const isOwn = message.senderId === Number(user?.id);
                  const msgTime = message.createdAt || message.sentAt || "";
                  const prevTime = idx > 0 ? (messages[idx - 1].createdAt || messages[idx - 1].sentAt || "") : "";
                  const msgText = message.content || message.text || "";
                  const showDate = idx === 0 || (msgTime && prevTime &&
                    format(new Date(prevTime), 'yyyy-MM-dd') !== 
                    format(new Date(msgTime), 'yyyy-MM-dd'));
                  
                  return (
                    <div key={message.id}>
                      {showDate && msgTime && (
                        <div className="my-4 flex items-center justify-center">
                          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                            {format(new Date(msgTime), "d MMMM yyyy", { locale: ro })}
                          </span>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex",
                        isOwn ? "justify-end" : "justify-start"
                      )}>
                        <div className={cn(
                          "flex max-w-[80%] items-end gap-2",
                          isOwn ? "flex-row-reverse" : "flex-row"
                        )}>
                          {!isOwn && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className={cn(
                            "rounded-2xl px-4 py-2",
                            isOwn 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-foreground"
                          )}>
                            <p className="whitespace-pre-wrap break-words">{msgText}</p>
                            <p className={cn(
                              "mt-1 text-right text-xs",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {msgTime ? format(new Date(msgTime), "HH:mm") : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="py-16 text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Începe conversația trimițând un mesaj
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrie un mesaj..."
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
