"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  CalendarClock,
  Star,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getViewings,
  updateViewingStatus,
  rescheduleViewing,
  submitViewingFeedback,
  getViewingParticipantName,
  getViewingPropertyImage,
  getViewingDate,
  Viewing,
  ViewingStatus,
} from "@/lib/viewingsApi";
import { formatDistanceToNow, format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<
  ViewingStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "În așteptare",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: "Confirmat",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Respins",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Anulat",
    color: "bg-muted text-muted-foreground",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Finalizat",
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: CheckCircle,
  },
};

export default function ViewingsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ViewingStatus | "all">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reschedule dialog
  const [rescheduleTarget, setRescheduleTarget] = useState<Viewing | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Feedback dialog
  const [feedbackTarget, setFeedbackTarget] = useState<Viewing | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackInterested, setFeedbackInterested] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchViewings = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const params = filter !== "all" ? { status: filter } : undefined;
        const data = await getViewings(params);
        setViewings(data);
      } catch (err) {
        console.error("Failed to fetch viewings:", err);
        setError("Nu am putut încărca vizionările");
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetchViewings();
  }, [isAuthenticated, isAuthLoading, filter]);

  const handleStatusChange = async (
    viewingId: string,
    newStatus: "CONFIRMED" | "REJECTED" | "CANCELLED"
  ) => {
    setActionLoading(viewingId);
    try {
      const updated = await updateViewingStatus(viewingId, newStatus);
      setViewings((prev) =>
        prev.map((v) => (v.id === viewingId ? updated : v))
      );
      const labels = { CONFIRMED: "confirmată", REJECTED: "respinsă", CANCELLED: "anulată" };
      toast.success(`Vizionarea a fost ${labels[newStatus]}.`);
    } catch {
      toast.error("Eroare la actualizarea statusului.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return;
    const newSlot = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    setActionLoading(rescheduleTarget.id);
    try {
      const updated = await rescheduleViewing(
        rescheduleTarget.id,
        newSlot,
        rescheduleReason || undefined
      );
      setViewings((prev) =>
        prev.map((v) => (v.id === rescheduleTarget.id ? updated : v))
      );
      toast.success("Vizionarea a fost reprogramată.");
      setRescheduleTarget(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    } catch {
      toast.error("Eroare la reprogramare.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeedback = async () => {
    if (!feedbackTarget || feedbackRating === 0) return;
    setActionLoading(feedbackTarget.id);
    try {
      await submitViewingFeedback(
        feedbackTarget.id,
        feedbackRating,
        feedbackComment || undefined,
        feedbackInterested ?? undefined
      );
      setViewings((prev) =>
        prev.map((v) =>
          v.id === feedbackTarget.id
            ? {
                ...v,
                feedback: {
                  rating: feedbackRating,
                  comment: feedbackComment || undefined,
                  interested: feedbackInterested ?? undefined,
                },
              }
            : v
        )
      );
      toast.success("Feedback trimis cu succes.");
      setFeedbackTarget(null);
      setFeedbackRating(0);
      setFeedbackComment("");
      setFeedbackInterested(null);
    } catch {
      toast.error("Eroare la trimiterea feedback-ului.");
    } finally {
      setActionLoading(null);
    }
  };

  const isOwner = (viewing: Viewing) =>
    String(viewing.owner?.id || "") === String(user?.id);

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
          <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea vizionările programate.
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
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Vizionări programate</h1>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Toate"],
                ["PENDING", "În așteptare"],
                ["CONFIRMED", "Confirmate"],
                ["COMPLETED", "Finalizate"],
              ] as [ViewingStatus | "all", string][]
            ).map(([key, label]) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
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
        ) : viewings.length > 0 ? (
          <div className="space-y-4">
            {viewings.map((viewing) => {
              const normalizedStatus = (viewing.status?.toUpperCase() || "PENDING") as ViewingStatus;
              const status = statusConfig[normalizedStatus] || statusConfig.PENDING;
              const StatusIcon = status.icon;
              const owner = isOwner(viewing);
              const otherPerson = viewing.otherParty || (owner ? viewing.requester : viewing.owner) || null;
              const otherPersonName = getViewingParticipantName(otherPerson);
              const propertyImg = getViewingPropertyImage(viewing.property);
              const viewingDateStr = getViewingDate(viewing);
              const viewingDate = viewingDateStr && !isNaN(new Date(viewingDateStr).getTime()) ? new Date(viewingDateStr) : null;
              const isPending = normalizedStatus === "PENDING";
              const isConfirmed = normalizedStatus === "CONFIRMED";
              const isCompleted = normalizedStatus === "COMPLETED";
              const canGiveFeedback = isCompleted && !viewing.feedback;

              return (
                <div
                  key={viewing.id}
                  className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-4">
                    {/* Property Image */}
                    <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {propertyImg ? (
                        <img
                          src={propertyImg}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/property/${viewing.property?.id || ""}`}
                            className="font-medium hover:text-primary"
                          >
                            {viewing.property?.title || "Proprietate"}
                          </Link>
                          {viewing.property?.address && (
                            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {viewing.property.address}
                              {viewing.property.city && `, ${viewing.property.city}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                              status.color
                            )}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                          {(isPending || isConfirmed) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={actionLoading === viewing.id}
                                >
                                  {actionLoading === viewing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {owner && isPending && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(viewing.id, "CONFIRMED")
                                      }
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                      Confirmă
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(viewing.id, "REJECTED")
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                      Respinge
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setRescheduleTarget(viewing)}
                                >
                                  <CalendarClock className="mr-2 h-4 w-4" />
                                  Reprogramează
                                </DropdownMenuItem>
                                {!owner && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(viewing.id, "CANCELLED")
                                    }
                                    className="text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Anulează
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* Date and time */}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        {viewingDate ? (
                          <>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(viewingDate, "d MMMM yyyy", { locale: ro })}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {format(viewingDate, "HH:mm")}
                              {(viewing.duration ?? 0) > 0 && (
                                <span className="ml-1">({viewing.duration} min)</span>
                              )}
                            </div>
                            <span className="text-muted-foreground">
                              ({formatDistanceToNow(viewingDate, { addSuffix: true, locale: ro })})
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Dată neprecizată</span>
                        )}
                      </div>

                      {/* Other person info */}
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{owner ? "Solicitant:" : "Proprietar:"}</span>
                        <span className="font-medium text-foreground">
                          {otherPersonName}
                        </span>
                        {otherPerson?.phone && (
                          <span className="text-xs">· {otherPerson.phone}</span>
                        )}
                        <Link
                          href={`/messages?chat=${otherPerson?.id || ""}`}
                          className="ml-auto flex items-center gap-1 text-primary hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Mesaj
                        </Link>
                      </div>

                      {viewing.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Note: {viewing.notes}
                        </p>
                      )}

                      {/* Feedback display */}
                      {viewing.feedback && (
                        <div className="mt-3 rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < viewing.feedback!.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                          {viewing.feedback.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {viewing.feedback.comment}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Leave feedback button */}
                      {canGiveFeedback && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setFeedbackTarget(viewing)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Lasă un feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">
              Nicio vizionare programată
            </h2>
            <p className="mt-2 text-muted-foreground">
              Programează vizionări pentru proprietățile care te interesează.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Explorează proprietăți</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleTarget !== null}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramează vizionarea</DialogTitle>
            <DialogDescription>
              Alege o nouă dată și oră pentru vizionare.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>Ora</Label>
                <Input
                  type="time"
                  className="mt-1"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Motiv (opțional)</Label>
              <Textarea
                className="mt-1"
                placeholder="De ce dorești reprogramarea..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Anulează
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={
                !rescheduleDate ||
                !rescheduleTime ||
                actionLoading === rescheduleTarget?.id
              }
            >
              {actionLoading === rescheduleTarget?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reprogramează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackTarget !== null}
        onOpenChange={(open) => !open && setFeedbackTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback vizionare</DialogTitle>
            <DialogDescription>
              Cum a fost experiența vizionării?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Star rating */}
            <div>
              <Label>Evaluare</Label>
              <div className="mt-2 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeedbackRating(i + 1)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7 transition-colors",
                        i < feedbackRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground hover:text-amber-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <Label>Comentariu (opțional)</Label>
              <Textarea
                className="mt-1"
                placeholder="Descrie experiența ta..."
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Interest */}
            <div>
              <Label>Ești interesat de această proprietate?</Label>
              <div className="mt-2 flex gap-2">
                {[
                  { value: true, label: "Da, sunt interesat" },
                  { value: false, label: "Nu, nu mă interesează" },
                ].map(({ value, label }) => (
                  <Button
                    key={String(value)}
                    type="button"
                    variant={feedbackInterested === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFeedbackInterested(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackTarget(null)}>
              Anulează
            </Button>
            <Button
              onClick={handleFeedback}
              disabled={
                feedbackRating === 0 ||
                actionLoading === feedbackTarget?.id
              }
            >
              {actionLoading === feedbackTarget?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trimite feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
