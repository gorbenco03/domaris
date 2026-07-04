"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Check,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
} from "@/lib/notificationsApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

// ---------------------------------------------------------------------------
// Helpers – normalizare tip (tratăm atât UPPERCASE cât și lowercase)
// ---------------------------------------------------------------------------

function normalizeType(type: string): string {
  return type.toLowerCase();
}

// ---------------------------------------------------------------------------
// Icon mapping – după tip normalizat (lowercase)
// ---------------------------------------------------------------------------

const iconMap: Record<string, typeof Bell> = {
  // mesaje
  message: MessageSquare,
  new_message: MessageSquare,
  // vizionări
  viewing_requested: Calendar,
  viewing_confirmed: CheckCircle2,
  viewing_rejected: Calendar,
  viewing_cancelled: Calendar,
  viewing_rescheduled: Calendar,
  viewing_reminder: Calendar,
  // contracte
  contract_proposed: FileText,
  contract_accepted: FileText,
  contract_signed: FileText,
  contract_partially_signed: FileText,
  // proprietăți
  new_property_match: Home,
  property_status_change: FileCheck,
  favorite_price_drop: Heart,
  // conturi
  verification_status_change: Shield,
  subscription_expiring: CreditCard,
  subscription_past_due: CreditCard,
  subscription_expired: CreditCard,
  promotion_expired: CreditCard,
  // feedback
  feedback_request: CheckCircle2,
  // sistem
  system: Megaphone,
  system_announcement: Megaphone,
};

// ---------------------------------------------------------------------------
// Color mapping – după tip normalizat (lowercase)
// ---------------------------------------------------------------------------

const colorMap: Record<string, string> = {
  // mesaje
  message: "text-blue-500",
  new_message: "text-blue-500",
  // vizionări
  viewing_requested: "text-orange-500",
  viewing_confirmed: "text-emerald-500",
  viewing_rejected: "text-red-500",
  viewing_cancelled: "text-red-500",
  viewing_rescheduled: "text-orange-500",
  viewing_reminder: "text-orange-500",
  // contracte
  contract_proposed: "text-violet-500",
  contract_accepted: "text-violet-500",
  contract_signed: "text-emerald-500",
  contract_partially_signed: "text-violet-500",
  // proprietăți
  new_property_match: "text-purple-500",
  property_status_change: "text-violet-500",
  favorite_price_drop: "text-pink-500",
  // conturi
  verification_status_change: "text-teal-500",
  subscription_expiring: "text-yellow-500",
  subscription_past_due: "text-yellow-500",
  subscription_expired: "text-red-500",
  promotion_expired: "text-yellow-500",
  // feedback
  feedback_request: "text-blue-500",
  // sistem
  system: "text-gray-500",
  system_announcement: "text-gray-500",
};

function getIcon(type: string): typeof Bell {
  return iconMap[normalizeType(type)] ?? Bell;
}

function getColor(type: string): string {
  return colorMap[normalizeType(type)] ?? "text-gray-500";
}

// ---------------------------------------------------------------------------
// Route mapper – construiește ruta de navigare din tipul și metadata notificării
// ---------------------------------------------------------------------------

function getNotificationRoute(notif: Notification): string | null {
  const t = normalizeType(notif.type);
  const meta = notif.metadata ?? {};

  // Mesaje
  if (t === "message" || t === "new_message") {
    const convId = meta.conversationId;
    if (convId) return `/messages?chat=${convId}`;
    return "/messages";
  }

  // Vizionări
  if (t.startsWith("viewing_")) {
    const viewingId = meta.viewingId;
    if (viewingId) return `/viewings/${viewingId}`;
    return "/viewings";
  }

  // Contracte
  if (t.startsWith("contract_")) {
    const contractId = meta.contractId;
    if (contractId) return `/contracts/${contractId}`;
    return "/contracts/mine";
  }

  // Proprietăți / match
  if (t === "new_property_match" || t === "property_status_change") {
    const propertyId = meta.propertyId;
    if (propertyId) return `/property/${propertyId}`;
    return "/search";
  }

  if (t === "favorite_price_drop") {
    const propertyId = meta.propertyId;
    if (propertyId) return `/property/${propertyId}`;
    return "/search";
  }

  // Feedback
  if (t === "feedback_request") {
    const viewingId = meta.viewingId;
    if (viewingId) return `/viewings/${viewingId}`;
    return "/viewings";
  }

  return null;
}

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

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

  const handleMarkAsRead = useCallback(async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

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

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notificare ștearsă");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Nu am putut șterge notificarea");
    }
  };

  /** Click pe notificare: marchează ca citit și navighează la ruta aferentă. */
  const handleNotificationClick = useCallback(async (notif: Notification) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    const route = getNotificationRoute(notif);
    if (route) {
      router.push(route);
    }
  }, [handleMarkAsRead, router]);

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
                  const IconComponent = getIcon(notif.type);
                  const iconColor = getColor(notif.type);
                  const route = getNotificationRoute(notif);
                  const isClickable = route !== null;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "flex items-start gap-3 p-4 transition-all hover:bg-muted/50",
                        !notif.isRead && "bg-primary/5",
                        isClickable && "cursor-pointer"
                      )}
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                      onKeyDown={isClickable ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNotificationClick(notif);
                        }
                      } : undefined}
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
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Marchează ca citit"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
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
