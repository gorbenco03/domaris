"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, User, MessageSquare, Calendar, Home, ChevronDown, LogOut, Clock, ArrowRight, Heart, Shield, CreditCard, Megaphone, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markAllNotificationsAsRead, Notification, NotificationType } from "@/lib/notificationsApi";
import { getConversations, ConversationListItem } from "@/lib/messagingApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

const notificationIcons: Record<NotificationType, typeof Bell> = {
  MESSAGE: MessageSquare,
  VIEWING_CONFIRMED: Calendar,
  VIEWING_REMINDER: Calendar,
  VIEWING_CANCELLED: Calendar,
  NEW_PROPERTY_MATCH: Home,
  PROPERTY_STATUS_CHANGE: Home,
  FAVORITE_PRICE_DROP: Heart,
  VERIFICATION_STATUS_CHANGE: Shield,
  SUBSCRIPTION_EXPIRING: CreditCard,
  SYSTEM_ANNOUNCEMENT: Megaphone,
};

const notificationColors: Record<NotificationType, string> = {
  MESSAGE: "text-blue-500",
  VIEWING_CONFIRMED: "text-green-500",
  VIEWING_REMINDER: "text-orange-500",
  VIEWING_CANCELLED: "text-red-500",
  NEW_PROPERTY_MATCH: "text-purple-500",
  PROPERTY_STATUS_CHANGE: "text-indigo-500",
  FAVORITE_PRICE_DROP: "text-pink-500",
  VERIFICATION_STATUS_CHANGE: "text-teal-500",
  SUBSCRIPTION_EXPIRING: "text-yellow-500",
  SYSTEM_ANNOUNCEMENT: "text-gray-500",
};

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentConversations, setRecentConversations] = useState<ConversationListItem[]>([]);

  // Fetch notifications + conversations on mount and every 30s
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifData, convData] = await Promise.all([
        getNotifications().catch(() => []),
        getConversations({ limit: 5 }).catch(() => []),
      ]);
      setNotifications(notifData.slice(0, 5));
      setRecentConversations(convData.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch navbar data:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const unreadMessages = recentConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const navLinks = [{
    label: "Apartamente",
    href: "/search?type=apartment"
  }, {
    label: "Case",
    href: "/search?type=house"
  }, {
    label: "Comercial",
    href: "/search?type=commercial"
  }, {
    label: "Terenuri",
    href: "/search?type=land"
  }, {
    label: "RIVA AI",
    href: "/ai-chat",
    icon: true
  }];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-wide text-primary">
          RIVA
        </Link>

        {/* Nav Links - Desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(link => (
            <Link 
              key={link.label} 
              href={link.href} 
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                link.icon 
                  ? "flex items-center gap-1.5 text-accent hover:text-accent" 
                  : "text-foreground"
              )}
            >
              {link.icon && <Bot className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              {/* Messages Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <MessageSquare className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shadow-sm">
                        {unreadMessages}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  align="end" 
                  sideOffset={8}
                  className="w-[360px] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl"
                >
                  <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">Mesaje</h3>
                      {unreadMessages > 0 && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                          {unreadMessages} noi
                        </span>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-y divide-border">
                      {recentConversations.length > 0 ? recentConversations.map((conv) => {
                        const name = conv.otherParticipant?.name || "Utilizator";
                        const initials = name.split(" ").map((n: string) => n[0] || "").join("").slice(0, 2);
                        const hasUnread = (conv.unreadCount || 0) > 0;
                        const lastMsg = conv.lastMessage?.content || "Conversație nouă";
                        const lastTime = conv.lastMessage?.createdAt
                          ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false, locale: ro })
                          : "";
                        return (
                          <Link
                            key={conv.id}
                            href={`/messages?chat=${conv.id}`}
                            className={`flex items-start gap-3 p-4 transition-all hover:bg-muted/50 ${hasUnread ? "bg-primary/5" : ""}`}
                          >
                            <div className="relative">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground shadow-sm">
                                {initials}
                              </div>
                              {hasUnread && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-accent" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`font-medium ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                  {name}
                                </p>
                                {lastTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {lastTime}
                                  </div>
                                )}
                              </div>
                              <p className={`mt-0.5 truncate text-sm ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
                                {lastMsg}
                              </p>
                            </div>
                          </Link>
                        );
                      }) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          Niciun mesaj
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <Link 
                      href="/messages" 
                      className="flex items-center justify-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Vezi toate mesajele
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Notifications Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  align="end" 
                  sideOffset={8}
                  className="w-[360px] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl"
                >
                  <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">Notificări</h3>
                      {unreadNotifications > 0 && (
                        <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                          {unreadNotifications} noi
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Marchează citite
                    </button>
                  </div>
                  <ScrollArea className="max-h-[320px]">
                    <div className="divide-y divide-border">
                      {notifications.length > 0 ? notifications.map((notif) => {
                        const IconComponent = notificationIcons[notif.type] || Bell;
                        const colorClass = notificationColors[notif.type] || "text-gray-500";
                        return (
                          <Link
                            key={notif.id}
                            href="/notifications"
                            className={`flex items-start gap-3 p-4 transition-all hover:bg-muted/50 ${!notif.isRead ? "bg-primary/5" : ""}`}
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${colorClass}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                                )}
                              </div>
                              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ro })}
                              </div>
                            </div>
                          </Link>
                        );
                      }) : (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          Nicio notificare
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <Link 
                      href="/notifications" 
                      className="flex items-center justify-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      Vezi toate notificările
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" className="ml-2 hidden sm:flex" asChild>
                <Link href="/add-property">Adaugă anunț</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="ml-1 bg-accent text-accent-foreground hover:bg-accent/90">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.firstName || "Contul meu"}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="flex items-center gap-2 cursor-pointer">
                      <MessageSquare className="h-4 w-4" />
                      Mesaje
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/viewings" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      Calendar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-properties" className="flex items-center gap-2 cursor-pointer">
                      <Home className="h-4 w-4" />
                      Proprietățile mele
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Contul meu
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => await logout()}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Deconectează-te
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth">Autentifică-te</Link>
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/auth">Creează cont</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
