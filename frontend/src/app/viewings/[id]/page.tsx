"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarClock,
  Star,
  MessageCircle,
  FileText,
  Home,
  User,
  RefreshCw,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getViewingById,
  updateViewingStatus,
  rescheduleViewing,
  submitViewingFeedback,
  getViewingParticipantName,
  getViewingPropertyImage,
  getViewingDate,
  Viewing,
  ViewingStatus,
} from "@/lib/viewingsApi";
import { proposeContract, ProposeContractData } from "@/lib/contractsApi";
import { format, formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  ViewingStatus,
  { label: string; color: string; bgClass: string; icon: React.ElementType }
> = {
  PENDING: {
    label: "În așteptare",
    color: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10",
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: "Confirmat",
    color: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Respins",
    color: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-500/10",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Anulat",
    color: "text-muted-foreground",
    bgClass: "bg-muted",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Finalizat",
    color: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-500/10",
    icon: CheckCircle,
  },
};

// ============================================================================
// PAGE
// ============================================================================

export default function ViewingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [viewing, setViewing] = useState<Viewing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reschedule dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  // Reject dialog (needs reason)
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Feedback dialog
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackInterested, setFeedbackInterested] = useState<boolean | null>(null);

  // Propose contract dialog
  const [proposeOpen, setProposeOpen] = useState(false);
  const [contractForm, setContractForm] = useState<ProposeContractData>({
    monthlyRent: 0,
    deposit: 0,
    currency: "EUR",
    startDate: "",
    endDate: "",
    terms: "",
  });

  // -------------------------------------------------------------------------
  // Load
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) return;

    const fetchViewing = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getViewingById(id);
        setViewing(data);
      } catch {
        setError("Nu am putut încărca vizionarea.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewing();
  }, [id, isAuthenticated, isAuthLoading]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const isOwnerCheck = (): boolean => {
    if (!viewing || !user?.id) return false;
    const uid = String(user.id);
    if (viewing.role === "OWNER") return true;
    if (viewing.role === "REQUESTER") return false;
    if (viewing.owner?.id && String(viewing.owner.id) === uid) return true;
    if ((viewing as any).ownerId && String((viewing as any).ownerId) === uid)
      return true;
    if (viewing.requester?.id && String(viewing.requester.id) === uid)
      return false;
    return true;
  };

  const isOwner = viewing ? isOwnerCheck() : false;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleStatusChange = async (
    status: "CONFIRMED" | "REJECTED" | "CANCELLED",
    reason?: string
  ) => {
    if (!viewing) return;
    setActionLoading(true);
    try {
      const updated = await updateViewingStatus(viewing.id, status, reason);
      setViewing(updated);
      const labels = {
        CONFIRMED: "confirmată",
        REJECTED: "respinsă",
        CANCELLED: "anulată",
      };
      toast.success(`Vizionarea a fost ${labels[status]}.`);
    } catch {
      toast.error("Eroare la actualizarea statusului.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) return;
    const newSlot = new Date(`${rescheduleDate}T${rescheduleTime}`).toISOString();
    setActionLoading(true);
    try {
      const updated = await rescheduleViewing(
        id,
        newSlot,
        rescheduleReason || undefined
      );
      setViewing(updated);
      toast.success("Vizionarea a fost reprogramată.");
      setRescheduleOpen(false);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleReason("");
    } catch {
      toast.error("Eroare la reprogramare.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!viewing || feedbackRating === 0) return;
    setActionLoading(true);
    try {
      await submitViewingFeedback(
        viewing.id,
        feedbackRating,
        feedbackComment || undefined,
        feedbackInterested ?? undefined
      );
      setViewing((prev) =>
        prev
          ? {
              ...prev,
              feedback: {
                rating: feedbackRating,
                comment: feedbackComment || undefined,
                interested: feedbackInterested ?? undefined,
              },
            }
          : prev
      );
      toast.success("Feedback trimis cu succes.");
      setFeedbackOpen(false);
    } catch {
      toast.error("Eroare la trimiterea feedback-ului.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeContract = async () => {
    if (!viewing) return;
    if (!contractForm.monthlyRent || !contractForm.startDate || !contractForm.endDate)
      return;
    setActionLoading(true);
    try {
      const contract = await proposeContract(viewing.id, {
        monthlyRent: Number(contractForm.monthlyRent),
        deposit: Number(contractForm.deposit),
        currency: contractForm.currency || "EUR",
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        terms: contractForm.terms || undefined,
      });
      toast.success("Contractul a fost propus. Chiriașul va fi notificat.", {
        action: {
          label: "Vezi contractul",
          onClick: () => router.push(`/contracts/${contract.id}`),
        },
      });
      setProposeOpen(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Eroare la propunerea contractului.");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Auth guard
  // -------------------------------------------------------------------------

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
            Trebuie să fii autentificat pentru a vedea detaliile vizionării.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Loading / error states
  // -------------------------------------------------------------------------

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

  if (error || !viewing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Vizionare negăsită</h1>
          <p className="mt-2 text-muted-foreground">
            {error || "Vizionarea nu a putut fi încărcată."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/viewings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Înapoi la vizionări
              </Link>
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Încearcă din nou
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const normalizedStatus = (viewing.status?.toUpperCase() ||
    "PENDING") as ViewingStatus;
  const statusInfo = statusConfig[normalizedStatus] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  const viewingDateStr = getViewingDate(viewing);
  const viewingDate =
    viewingDateStr && !isNaN(new Date(viewingDateStr).getTime())
      ? new Date(viewingDateStr)
      : null;

  const propertyImg = getViewingPropertyImage(viewing.property);

  // The "other party" from the current user's perspective
  const otherPerson =
    viewing.otherParty ||
    (isOwner ? viewing.requester : viewing.owner) ||
    null;
  const otherPersonName = getViewingParticipantName(otherPerson);

  const isPending = normalizedStatus === "PENDING";
  const isConfirmed = normalizedStatus === "CONFIRMED";
  const isCompleted = normalizedStatus === "COMPLETED";
  const isTerminal =
    normalizedStatus === "CANCELLED" || normalizedStatus === "REJECTED";

  const canGiveFeedback = isCompleted && !viewing.feedback && !isOwner;
  const canProposeContract = isCompleted && isOwner;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/viewings"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Vizionările mele
          </Link>
        </div>

        {/* Property hero */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card">
          {/* Image */}
          <div className="relative h-52 w-full bg-muted sm:h-64">
            {propertyImg ? (
              <img
                src={propertyImg}
                alt={viewing.property?.title || "Proprietate"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Home className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            {/* Status badge over image */}
            <div
              className={cn(
                "absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm",
                statusInfo.bgClass,
                statusInfo.color
              )}
            >
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </div>
          </div>

          {/* Property info */}
          <div className="p-5">
            <Link
              href={`/property/${viewing.property?.id || ""}`}
              className="text-xl font-bold hover:text-primary"
            >
              {viewing.property?.title || "Proprietate"}
            </Link>
            {viewing.property?.address && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {viewing.property.address}
                  {viewing.property.city && `, ${viewing.property.city}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Date & Time */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold">Data și ora</h2>
            {viewingDate ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {format(viewingDate, "d MMMM yyyy", { locale: ro })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ora</p>
                    <p className="font-medium">
                      {format(viewingDate, "HH:mm")}
                      {(viewing.duration ?? 0) > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({viewing.duration} min)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(viewingDate, {
                    addSuffix: true,
                    locale: ro,
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Dată neprecizată</p>
            )}
          </div>

          {/* Participants */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold">
              {isOwner ? "Solicitant" : "Proprietar"}
            </h2>
            {otherPerson ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {otherPerson.avatar ? (
                      <img
                        src={otherPerson.avatar}
                        alt={otherPersonName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{otherPersonName}</p>
                    {otherPerson.phone && (
                      <p className="text-sm text-muted-foreground">
                        {otherPerson.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {otherPerson.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a href={`tel:${otherPerson.phone}`}>
                        <Phone className="mr-1.5 h-3.5 w-3.5" />
                        Sună
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/messages?chat=${otherPerson.id}`}>
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      Mesaj
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Informații indisponibile</p>
            )}
          </div>
        </div>

        {/* Notes */}
        {(viewing.notes || viewing.requesterNote || viewing.ownerNote) && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold">Note</h2>
            {(viewing.notes || viewing.requesterNote) && (
              <p className="text-sm text-muted-foreground">
                {viewing.notes || viewing.requesterNote}
              </p>
            )}
            {viewing.ownerNote && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Notă proprietar:{" "}
                </span>
                {viewing.ownerNote}
              </p>
            )}
          </div>
        )}

        {/* Cancellation reason */}
        {isTerminal && viewing.cancellationReason && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/50 p-5">
            <p className="text-sm font-medium text-foreground">
              Motiv:{" "}
              <span className="font-normal text-muted-foreground">
                {viewing.cancellationReason}
              </span>
            </p>
          </div>
        )}

        {/* Existing feedback */}
        {viewing.feedback && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-base font-semibold">Feedback-ul tău</h2>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < viewing.feedback!.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            {viewing.feedback.comment && (
              <p className="mt-2 text-sm text-muted-foreground">
                {viewing.feedback.comment}
              </p>
            )}
            {viewing.feedback.interested != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {viewing.feedback.interested
                  ? "Interesat de proprietate"
                  : "Nu este interesat de proprietate"}
              </p>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* ACTION BUTTONS                                                    */}
        {/* ---------------------------------------------------------------- */}

        {/* Owner: Confirm / Reject pending viewing */}
        {isOwner && isPending && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleStatusChange("CONFIRMED")}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Confirmă vizionarea
            </Button>
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setRejectOpen(true)}
              disabled={actionLoading}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Respinge
            </Button>
          </div>
        )}

        {/* Owner: Reschedule confirmed viewing */}
        {isOwner && isConfirmed && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => setRescheduleOpen(true)}
              disabled={actionLoading}
            >
              <CalendarClock className="mr-2 h-4 w-4" />
              Reprogramează
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Anulează
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anulare vizionare</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ești sigur că dorești să anulezi această vizionare?
                    Solicitantul va fi notificat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Nu</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleStatusChange("CANCELLED")}
                  >
                    Da, anulează
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Requester: Cancel pending or confirmed viewing */}
        {!isOwner && (isPending || isConfirmed) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {isConfirmed && (
              <Button
                variant="outline"
                onClick={() => setRescheduleOpen(true)}
                disabled={actionLoading}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reprogramează
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Anulează vizionarea
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anulare vizionare</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ești sigur că dorești să anulezi această vizionare?
                    Proprietarul va fi notificat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Nu</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => handleStatusChange("CANCELLED")}
                  >
                    Da, anulează
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Requester: Leave feedback (completed viewing) */}
        {canGiveFeedback && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => setFeedbackOpen(true)}
              disabled={actionLoading}
            >
              <Star className="mr-2 h-4 w-4" />
              Lasă un feedback
            </Button>
          </div>
        )}

        {/* Owner: Propose contract (completed viewing) */}
        {canProposeContract && (
          <div className="mt-6">
            <Button
              onClick={() => {
                setProposeOpen(true);
                setContractForm({
                  monthlyRent: 0,
                  deposit: 0,
                  currency: "EUR",
                  startDate: "",
                  endDate: "",
                  terms: "",
                });
              }}
              disabled={actionLoading}
            >
              <FileText className="mr-2 h-4 w-4" />
              Propune contract de închiriere
            </Button>
          </div>
        )}
      </main>

      {/* ================================================================== */}
      {/* DIALOGS                                                             */}
      {/* ================================================================== */}

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge vizionarea</DialogTitle>
            <DialogDescription>
              Introdu un motiv pentru respingere (opțional). Solicitantul va fi
              notificat.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motiv (opțional)</Label>
            <Textarea
              className="mt-1"
              placeholder="ex: Nu sunt disponibil în acea perioadă..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Anulează
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleStatusChange("REJECTED", rejectReason || undefined);
                setRejectOpen(false);
                setRejectReason("");
              }}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Respinge vizionarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
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
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime || actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reprogramează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback vizionare</DialogTitle>
            <DialogDescription>Cum a fost experiența vizionării?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <Label>Ești interesat de această proprietate?</Label>
              <div className="mt-2 flex gap-2">
                {[
                  { value: true, label: "Da" },
                  { value: false, label: "Nu" },
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
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleFeedback}
              disabled={feedbackRating === 0 || actionLoading}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trimite feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Propose contract dialog */}
      <Dialog open={proposeOpen} onOpenChange={setProposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Propune contract de închiriere</DialogTitle>
            <DialogDescription>
              Completează termenii contractului. Chiriașul va fi notificat și va
              putea accepta sau semna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Chirie lunară *</Label>
                <div className="mt-1 flex">
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    className="rounded-r-none"
                    placeholder="ex: 350"
                    value={contractForm.monthlyRent || ""}
                    onChange={(e) =>
                      setContractForm((f) => ({
                        ...f,
                        monthlyRent: Number(e.target.value),
                      }))
                    }
                  />
                  <span className="flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    {contractForm.currency}
                  </span>
                </div>
              </div>
              <div>
                <Label>Garanție (depozit)</Label>
                <div className="mt-1 flex">
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    className="rounded-r-none"
                    placeholder="ex: 700"
                    value={contractForm.deposit || ""}
                    onChange={(e) =>
                      setContractForm((f) => ({
                        ...f,
                        deposit: Number(e.target.value),
                      }))
                    }
                  />
                  <span className="flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    {contractForm.currency}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <Label>Monedă</Label>
              <div className="mt-1 flex gap-2">
                {["EUR", "USD", "MDL"].map((cur) => (
                  <Button
                    key={cur}
                    type="button"
                    size="sm"
                    variant={contractForm.currency === cur ? "default" : "outline"}
                    onClick={() =>
                      setContractForm((f) => ({ ...f, currency: cur }))
                    }
                  >
                    {cur}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Data de început *</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={contractForm.startDate}
                  onChange={(e) =>
                    setContractForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>Data de încheiere *</Label>
                <Input
                  type="date"
                  className="mt-1"
                  value={contractForm.endDate}
                  onChange={(e) =>
                    setContractForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  min={
                    contractForm.startDate ||
                    new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>
            <div>
              <Label>Clauze suplimentare (opțional)</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Reguli casă, condiții speciale, responsabilități..."
                value={contractForm.terms || ""}
                onChange={(e) =>
                  setContractForm((f) => ({ ...f, terms: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProposeOpen(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleProposeContract}
              disabled={
                !contractForm.monthlyRent ||
                !contractForm.startDate ||
                !contractForm.endDate ||
                actionLoading
              }
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Trimite propunerea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
