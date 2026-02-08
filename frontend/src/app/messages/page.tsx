"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getConversations, 
  getMessages, 
  sendMessage as sendMessageApi,
  ConversationListItem, 
  Message 
} from "@/lib/messagingApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";

export default function MessagesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Auto-select conversation from URL param
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) {
      const id = parseInt(chatId, 10);
      if (!isNaN(id)) {
        setSelectedConversation(id);
      }
    }
  }, [searchParams]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      try {
        const data = await getConversations({});
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchConversations();
    }
  }, [isAuthenticated, isAuthLoading]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      
      setIsLoadingMessages(true);
      try {
        const data = await getMessages(selectedConversation);
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const sent = await sendMessageApi(selectedConversation, newMessage.trim());
      setMessages(prev => [...prev, sent]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const activeConversation = conversations.find((c) => c.id === selectedConversation);

  const filteredConversations = conversations.filter(
    (c) =>
      c.otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.property.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Mesaje</h1>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-[600px] lg:grid-cols-3">
            {/* Conversations List */}
            <div
              className={cn(
                "border-r border-border lg:col-span-1",
                selectedConversation !== null && "hidden lg:block"
              )}
            >
              {/* Search */}
              <div className="border-b border-border p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Caută conversații..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <div className="h-[calc(600px-73px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-muted",
                        selectedConversation === conversation.id && "bg-muted"
                      )}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={conversation.otherParticipant.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.otherParticipant.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.otherParticipant.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-accent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground">
                            {conversation.otherParticipant.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage 
                              ? formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { locale: ro })
                              : ""}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.property.title}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.lastMessage?.content}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Nu ai conversații</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div
              className={cn(
                "flex flex-col lg:col-span-2",
                selectedConversation === null && "hidden lg:flex"
              )}
            >
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {activeConversation.otherParticipant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {activeConversation.otherParticipant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeConversation.otherParticipant.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.isFromCurrentUser ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                message.isFromCurrentUser
                                  ? "bg-accent text-accent-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              <p>{message.content}</p>
                              <div
                                className={cn(
                                  "mt-1 flex items-center justify-end gap-1 text-xs",
                                  message.isFromCurrentUser
                                    ? "text-accent-foreground/70"
                                    : "text-muted-foreground"
                                )}
                              >
                                <span>
                                  {new Date(message.createdAt).toLocaleTimeString("ro-RO", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {message.isFromCurrentUser && (
                                  <CheckCheck className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input
                        type="text"
                        placeholder="Scrie un mesaj..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        size="icon" 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={handleSendMessage}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    Selectează o conversație
                  </h2>
                  <p className="text-muted-foreground">
                    Alege o conversație din stânga pentru a vedea mesajele
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
