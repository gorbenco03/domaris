"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Bell, 
  BellOff,
  MessageCircle,
  Calendar,
  Home,
  Heart,
  Shield,
  CreditCard,
  Megaphone,
  CheckCheck,
  Trash2,
  Settings
} from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const notificationIcons: Record<NotificationType, typeof Bell> = {
  MESSAGE: MessageCircle,
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
  MESSAGE: "text-blue-500 bg-blue-500/10",
  VIEWING_CONFIRMED: "text-green-500 bg-green-500/10",
  VIEWING_REMINDER: "text-orange-500 bg-orange-500/10",
  VIEWING_CANCELLED: "text-red-500 bg-red-500/10",
  NEW_PROPERTY_MATCH: "text-purple-500 bg-purple-500/10",
  PROPERTY_STATUS_CHANGE: "text-indigo-500 bg-indigo-500/10",
  FAVORITE_PRICE_DROP: "text-pink-500 bg-pink-500/10",
  VERIFICATION_STATUS_CHANGE: "text-teal-500 bg-teal-500/10",
  SUBSCRIPTION_EXPIRING: "text-yellow-500 bg-yellow-500/10",
  SYSTEM_ANNOUNCEMENT: "text-gray-500 bg-gray-500/10",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Nu am putut încărca notificările");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
      toast.error("Nu am putut marca notificarea");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Toate notificările au fost marcate ca citite");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast.error("Nu am putut marca notificările");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notificare ștearsă");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error("Nu am putut șterge notificarea");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    
    // Navigate based on notification type and data
    if (notification.data) {
      if (notification.type === "MESSAGE" && notification.data.conversationId) {
        router.push(`/messages/${notification.data.conversationId}`);
      } else if (
        (notification.type === "VIEWING_CONFIRMED" || 
         notification.type === "VIEWING_REMINDER" || 
         notification.type === "VIEWING_CANCELLED") && 
        notification.data.viewingId
      ) {
        router.push("/viewings");
      } else if (
        (notification.type === "NEW_PROPERTY_MATCH" || 
         notification.type === "PROPERTY_STATUS_CHANGE" ||
         notification.type === "FAVORITE_PRICE_DROP") && 
        notification.data.propertyId
      ) {
        router.push(`/property/${notification.data.propertyId}`);
      }
    }
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notificări</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">{unreadCount} necitite</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Marchează toate
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Toate ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Necitite ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {error ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={loadNotifications}>
              Încearcă din nou
            </Button>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              const colorClass = notificationColors[notification.type] || "text-gray-500 bg-gray-500/10";
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
                    !notification.isRead && "bg-accent/5 border-accent/20"
                  )}
                >
                  {/* Icon */}
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn(
                        "text-sm",
                        !notification.isRead && "font-semibold"
                      )}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ro })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              {filter === "unread" ? "Nicio notificare necitită" : "Nicio notificare"}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
