"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  ArrowLeft, 
  Loader2, 
  Clock,
  MessageSquare,
  Calendar,
  Home,
  Heart,
  Shield,
  CreditCard,
  Megaphone,
  CheckCircle2,
  FileCheck,
  Trash2,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
  NotificationType 
} from "@/lib/notificationsApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icon mapping matching pixel-perfect-pixels style
const notificationIcons: Record<NotificationType, typeof Bell> = {
  MESSAGE: MessageSquare,
  VIEWING_CONFIRMED: CheckCircle2,
  VIEWING_REMINDER: Calendar,
  VIEWING_CANCELLED: Calendar,
  NEW_PROPERTY_MATCH: Home,
  PROPERTY_STATUS_CHANGE: FileCheck,
  FAVORITE_PRICE_DROP: Heart,
  VERIFICATION_STATUS_CHANGE: Shield,
  SUBSCRIPTION_EXPIRING: CreditCard,
  SYSTEM_ANNOUNCEMENT: Megaphone,
};

// Color mapping matching pixel-perfect-pixels style
const notificationColors: Record<NotificationType, string> = {
  MESSAGE: "text-blue-500",
  VIEWING_CONFIRMED: "text-emerald-500",
  VIEWING_REMINDER: "text-orange-500",
  VIEWING_CANCELLED: "text-red-500",
  NEW_PROPERTY_MATCH: "text-purple-500",
  PROPERTY_STATUS_CHANGE: "text-violet-500",
  FAVORITE_PRICE_DROP: "text-pink-500",
  VERIFICATION_STATUS_CHANGE: "text-teal-500",
  SUBSCRIPTION_EXPIRING: "text-yellow-500",
  SYSTEM_ANNOUNCEMENT: "text-gray-500",
};

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // API state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setError("Nu am putut încărca notificările");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isAuthLoading) {
      fetchNotifications();
    }
  }, [isAuthenticated, isAuthLoading]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Toate notificările au fost marcate ca citite");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Nu am putut marca notificările ca citite");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notificare ștearsă");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Nu am putut șterge notificarea");
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          <Bell className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea notificările.
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
      
      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        {/* Header - matching pixel-perfect-pixels popup header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h1 className="font-semibold text-foreground">Notificări</h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                  {unreadCount} noi
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

          {/* Filter tabs */}
          <div className="flex gap-2 border-b border-border px-4 py-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === 'all' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Toate
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filter === 'unread' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Necitite
            </button>
          </div>

          {/* Notifications list - matching pixel-perfect-pixels popup style */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Încearcă din nou
              </Button>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <ScrollArea className="max-h-[600px]">
              <div className="divide-y divide-border">
                {filteredNotifications.map((notif) => {
                  const IconComponent = notificationIcons[notif.type] || Bell;
                  const iconColor = notificationColors[notif.type] || "text-gray-500";
                  
                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-4 transition-all hover:bg-muted/50",
                        !notif.isRead && "bg-primary/5"
                      )}
                    >
                      {/* Icon with colored background - matching pixel-perfect-pixels */}
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                        iconColor
                      )}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            !notif.isRead ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {notif.body || ""}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ro })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Marchează ca citit"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Șterge"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Nicio notificare</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === 'unread' 
                  ? "Nu ai notificări necitite" 
                  : "Notificările tale vor apărea aici"}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
