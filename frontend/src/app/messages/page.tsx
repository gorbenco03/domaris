"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft, Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations, ConversationListItem } from "@/lib/messagingApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  // API state
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getConversations({ type: filter });
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError("Nu am putut încărca conversațiile");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchConversations();
    }
  }, [isAuthenticated, isAuthLoading, filter]);

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mesaje</h1>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toate
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Necitite
            </Button>
            <Button
              variant={filter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('archived')}
            >
              Arhivate
            </Button>
          </div>
        </div>

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
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-border rounded-2xl border border-border bg-card">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => router.push(`/messages/${conversation.id}`)}
                className={cn(
                  "flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-muted/50",
                  conversation.unreadCount > 0 && "bg-primary/5"
                )}
              >
                {/* Property Image */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {conversation.property.image ? (
                    <img
                      src={conversation.property.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">
                      {conversation.otherParticipant.name}
                    </p>
                    {conversation.lastMessage && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                          addSuffix: true,
                          locale: ro,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.property.title}
                  </p>
                  {conversation.lastMessage && (
                    <p className={cn(
                      "mt-1 truncate text-sm",
                      conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}>
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {conversation.unreadCount > 0 && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {conversation.unreadCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Niciun mesaj încă</h2>
            <p className="mt-2 text-muted-foreground">
              Mesajele tale vor apărea aici când vei contacta un proprietar.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Explorează proprietăți</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
