"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Search,
  Send,
  Paperclip,
  MoreVertical,
  ArrowLeft,
  CheckCheck,
  Loader2,
  Archive,
  ArchiveRestore,
  Flag,
  ImageIcon,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversations,
  getMessages,
  sendMessage as sendMessageApi,
  markAsRead,
  archiveConversation,
  unarchiveConversation,
  ConversationListItem,
  Message,
} from "@/lib/messagingApi";
import { useMessagingSocket } from "@/hooks/useMessagingSocket";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

function MessagesContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket
  const handleNewMessage = useCallback(
    (message: Message) => {
      // Add to current messages if in same conversation
      if (message.conversationId === selectedConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      // Update conversation list last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: message.content,
                  createdAt: message.createdAt,
                  senderId: message.senderId,
                },
                unreadCount:
                  message.conversationId === selectedConversation
                    ? c.unreadCount
                    : c.unreadCount + 1,
              }
            : c
        )
      );
    },
    [selectedConversation]
  );

  const handleTyping = useCallback(
    (data: { userId: number; isTyping: boolean }) => {
      if (String(data.userId) === String(user?.id)) return;
      const conv = conversations.find((c) => c.id === selectedConversation);
      if (data.isTyping) {
        setTypingUser(conv?.otherParticipant.name || "...");
      } else {
        setTypingUser(null);
      }
    },
    [selectedConversation, conversations, user?.id]
  );

  const { emitTyping } = useMessagingSocket({
    conversationId: selectedConversation,
    onNewMessage: handleNewMessage,
    onTyping: handleTyping,
  });

  // Auto-select from URL
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId) setSelectedConversation(chatId);
  }, [searchParams]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const data = await getConversations({
          type: showArchived ? "archived" : "all",
        });
        setConversations(data);
      } catch {
        console.error("Failed to fetch conversations");
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetchConversations();
  }, [isAuthenticated, isAuthLoading, showArchived]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConversation) return;
      setIsLoadingMessages(true);
      try {
        const data = await getMessages(selectedConversation);
        setMessages(data);
        // Mark as read
        markAsRead(selectedConversation).catch((err) => {
          console.error("Failed to mark as read:", err);
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        console.error("Failed to fetch messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content?: string, type: "TEXT" | "IMAGE" = "TEXT") => {
    const text = content || newMessage.trim();
    if (!text || !selectedConversation) return;

    setIsSending(true);
    try {
      const sent = await sendMessageApi(selectedConversation, text, type);
      setMessages((prev) => [...prev, sent]);
      if (!content) setNewMessage("");
      emitTyping(false);
    } catch {
      toast.error("Nu am putut trimite mesajul.");
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleSendMessage(file.name, "IMAGE");
    e.target.value = "";
  };

  const handleArchive = async (convId: string, isArchived: boolean) => {
    try {
      if (isArchived) {
        await unarchiveConversation(convId);
        toast.success("Conversație dezarhivată.");
      } else {
        await archiveConversation(convId);
        toast.success("Conversație arhivată.");
      }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConversation === convId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch {
      toast.error("Eroare la arhivare.");
    }
  };

  const activeConversation = conversations.find(
    (c) => c.id === selectedConversation
  );

  const filteredConversations = conversations.filter(
    (c) =>
      c.otherParticipant.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Mesaje</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? (
              <>
                <MessageCircle className="mr-2 h-4 w-4" /> Active
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" /> Arhivate
              </>
            )}
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid h-[650px] lg:grid-cols-3">
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
              <div className="h-[calc(650px-73px)] overflow-y-auto">
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
                          <AvatarImage
                            src={
                              conversation.otherParticipant.avatar || undefined
                            }
                          />
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
                          <p
                            className={cn(
                              "text-foreground",
                              conversation.unreadCount > 0
                                ? "font-bold"
                                : "font-semibold"
                            )}
                          >
                            {conversation.otherParticipant.name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessage
                              ? formatDistanceToNow(
                                  new Date(conversation.lastMessage.createdAt),
                                  { locale: ro }
                                )
                              : ""}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.property.title}
                        </p>
                        <p
                          className={cn(
                            "truncate text-sm",
                            conversation.unreadCount > 0
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {conversation.lastMessage?.content}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-medium text-accent-foreground">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {showArchived
                        ? "Nu ai conversații arhivate"
                        : "Nu ai conversații"}
                    </p>
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
                  {/* Property Context Header */}
                  {activeConversation.property && (
                    <Link
                      href={`/property/${activeConversation.property.id}`}
                      className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2 transition-colors hover:bg-muted"
                    >
                      {activeConversation.property.image ? (
                        <img
                          src={activeConversation.property.image}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Home className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {activeConversation.property.title}
                        </p>
                        {activeConversation.property.price != null && (
                          <p className="text-xs font-semibold text-primary">
                            {(activeConversation.property.price ?? 0).toLocaleString()}{" "}
                            €
                          </p>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedConversation(null);
                          setMessages([]);
                        }}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            activeConversation.otherParticipant.avatar ||
                            undefined
                          }
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {activeConversation.otherParticipant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {activeConversation.otherParticipant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typingUser
                            ? "scrie..."
                            : activeConversation.otherParticipant.isOnline
                              ? "Online"
                              : "Offline"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleArchive(
                              activeConversation.id,
                              !!activeConversation.isArchived
                            )
                          }
                        >
                          {activeConversation.isArchived ? (
                            <>
                              <ArchiveRestore className="mr-2 h-4 w-4" />{" "}
                              Dezarhivează
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Arhivează
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Flag className="mr-2 h-4 w-4" /> Raportează
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const isOwn =
                            String(message.senderId) === String(user?.id);
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[70%] rounded-2xl px-4 py-2",
                                  isOwn
                                    ? "bg-accent text-accent-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                {message.type === "IMAGE" ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <ImageIcon className="h-4 w-4" />
                                    <span>{message.content}</span>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                )}
                                <div
                                  className={cn(
                                    "mt-1 flex items-center justify-end gap-1 text-xs",
                                    isOwn
                                      ? "text-accent-foreground/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <span>
                                    {new Date(
                                      message.createdAt
                                    ).toLocaleTimeString("ro-RO", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isOwn && (
                                    <CheckCheck
                                      className={cn(
                                        "h-3 w-3",
                                        message.isRead && "text-blue-500"
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {typingUser && (
                          <div className="flex justify-start">
                            <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                              <span className="animate-pulse">
                                {typingUser} scrie...
                              </span>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input
                        type="text"
                        placeholder="Scrie un mesaj..."
                        value={newMessage}
                        onChange={(e) => handleInputChange(e.target.value)}
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
                        className="h-9 w-9 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => handleSendMessage()}
                        disabled={!newMessage.trim() || isSending}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
