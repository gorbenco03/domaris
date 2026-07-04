"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Home,
  CalendarRange,
  Banknote,
  User,
  CheckCircle2,
  FileSignature,
  Printer,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getContract,
  acceptContract,
  signContract,
  getContractPartyName,
  getContractStatusLabel,
  getContractStatusColor,
  RentalContract,
} from "@/lib/contractsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// PRINT STYLES (injected as a style tag for window.print)
// ============================================================================

const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden !important; }
    #contract-printable, #contract-printable * { visibility: visible !important; }
    #contract-printable {
      position: fixed !important;
      inset: 0 !important;
      padding: 40px !important;
      background: white !important;
      font-family: Georgia, serif !important;
      font-size: 13px !important;
      line-height: 1.7 !important;
      color: #111 !important;
    }
  }
`;

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params?.id as string;

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Confirm dialogs
  const [confirmAction, setConfirmAction] = useState<"accept" | "sign" | null>(null);

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContract(contractId);
      setContract(data);
    } catch (err: any) {
      console.error("Failed to fetch contract:", err);
      setError(err?.message ?? "Nu am putut încărca contractul.");
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) fetchContract();
  }, [isAuthenticated, isAuthLoading, fetchContract]);

  // --------------------------------------------------------------------------
  // Derived state
  // --------------------------------------------------------------------------

  const userId = user ? String(user.id) : null;
  const isOwner = contract ? userId && String(contract.ownerId) === userId : false;
  const isSeeker = contract ? userId && String(contract.seekerId) === userId : false;

  const canAccept =
    contract?.status === "proposed" && isSeeker;
  const canSign =
    (contract?.status === "proposed" || contract?.status === "accepted") &&
    (isOwner || isSeeker) &&
    !(isOwner && contract?.signedByOwnerAt) &&
    !(isSeeker && contract?.signedBySeekerAt);
  const isSigned = contract?.status === "signed";

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const handleAccept = async () => {
    if (!contract) return;
    setActionLoading("accept");
    setConfirmAction(null);
    try {
      const updated = await acceptContract(contract.id);
      setContract(updated);
      toast.success("Contractul a fost acceptat.");
    } catch (err: any) {
      toast.error(err?.message ?? "Eroare la acceptarea contractului.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSign = async () => {
    if (!contract) return;
    setActionLoading("sign");
    setConfirmAction(null);
    try {
      const updated = await signContract(contract.id);
      setContract(updated);
      if (updated.status === "signed") {
        toast.success("Contractul a fost semnat de ambele părți. Anunțul a fost marcat ca închiriat.");
      } else {
        toast.success("Semnătura ta a fost înregistrată. Se așteaptă semnătura celeilalte părți.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Eroare la semnarea contractului.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    // Inject print styles temporarily
    const styleEl = document.createElement("style");
    styleEl.id = "contract-print-styles";
    styleEl.textContent = PRINT_STYLES;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => {
      const el = document.getElementById("contract-print-styles");
      if (el) el.remove();
    }, 1000);
  };

  // --------------------------------------------------------------------------
  // Render helpers
  // --------------------------------------------------------------------------

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: ro });
    } catch {
      return dateStr;
    }
  };

  // --------------------------------------------------------------------------
  // States: auth loading / not authenticated / loading / error
  // --------------------------------------------------------------------------

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
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea contractele.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

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

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Contract negăsit</h1>
          <p className="mt-2 text-muted-foreground">
            {error ?? "Contractul nu a putut fi găsit sau nu ai acces la el."}
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/contracts/mine">Contractele mele</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------

  const ownerName = getContractPartyName(contract.owner);
  const seekerName = getContractPartyName(contract.seeker);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/contracts/mine"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Contractele mele
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Contract de închiriere #{contract.id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Creat la {formatDate(contract.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={cn("border-0 text-sm px-3 py-1", getContractStatusColor(contract.status))}
            >
              {getContractStatusLabel(contract.status)}
            </Badge>
            {isSigned && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Printează
              </Button>
            )}
          </div>
        </div>

        {/* Signed success banner */}
        {isSigned && (
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Contract semnat
              </p>
              <p className="mt-0.5 text-sm text-emerald-700/80 dark:text-emerald-300/80">
                Ambele părți au semnat. Anunțul a fost marcat ca închiriat.
              </p>
            </div>
          </div>
        )}

        {/* Printable contract body */}
        <div
          id="contract-printable"
          className="rounded-2xl border border-border bg-card p-6 space-y-6"
        >
          {/* Listing */}
          <section>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Home className="h-4 w-4 text-muted-foreground" />
              Proprietate
            </h2>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="font-medium">
                {contract.listing?.title ?? "—"}
              </p>
              {contract.listing?.addressText && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {contract.listing.addressText}
                </p>
              )}
              {contract.listing?.id && (
                <Link
                  href={`/property/${contract.listing.id}`}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Vezi anunțul
                </Link>
              )}
            </div>
          </section>

          <Separator />

          {/* Parties */}
          <section>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              Părți contractante
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Proprietar (locator)
                </p>
                <p className="font-medium">{ownerName}</p>
                {contract.owner?.email && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{contract.owner.email}</p>
                )}
                {contract.owner?.phone && (
                  <p className="text-sm text-muted-foreground">{contract.owner.phone}</p>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Chiriaș (locatar)
                </p>
                <p className="font-medium">{seekerName}</p>
                {contract.seeker?.email && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{contract.seeker.email}</p>
                )}
                {contract.seeker?.phone && (
                  <p className="text-sm text-muted-foreground">{contract.seeker.phone}</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Financial terms */}
          <section>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              Condiții financiare
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Chirie lunară
                </p>
                <p className="text-xl font-bold">
                  {contract.monthlyRent.toLocaleString("ro-MD")}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {contract.currency}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Garanție (depozit)
                </p>
                <p className="text-xl font-bold">
                  {contract.deposit.toLocaleString("ro-MD")}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {contract.currency}
                  </span>
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Monedă
                </p>
                <p className="text-xl font-bold">{contract.currency}</p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Period */}
          <section>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              Perioada contractului
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Data de început
                </p>
                <p className="font-semibold">{formatDate(contract.startDate)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Data de încheiere
                </p>
                <p className="font-semibold">{formatDate(contract.endDate)}</p>
              </div>
            </div>
          </section>

          {/* Terms */}
          {contract.terms && (
            <>
              <Separator />
              <section>
                <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Clauze suplimentare
                </h2>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {contract.terms}
                  </p>
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Signatures status */}
          <section>
            <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
              <FileSignature className="h-4 w-4 text-muted-foreground" />
              Semnături
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "rounded-lg p-4 flex items-start gap-3",
                  contract.signedByOwnerAt
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-muted/50",
                )}
              >
                {contract.signedByOwnerAt ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                    Semnătură proprietar
                  </p>
                  {contract.signedByOwnerAt ? (
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Semnat la {formatDate(contract.signedByOwnerAt)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">În așteptare</p>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "rounded-lg p-4 flex items-start gap-3",
                  contract.signedBySeekerAt
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-muted/50",
                )}
              >
                {contract.signedBySeekerAt ? (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                    Semnătură chiriaș
                  </p>
                  {contract.signedBySeekerAt ? (
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Semnat la {formatDate(contract.signedBySeekerAt)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">În așteptare</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          {canAccept && (
            <Button
              onClick={() => setConfirmAction("accept")}
              disabled={actionLoading !== null}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {actionLoading === "accept" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Acceptă contractul
            </Button>
          )}

          {canSign && (
            <Button
              onClick={() => setConfirmAction("sign")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "sign" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="mr-2 h-4 w-4" />
              )}
              Semnează contractul
            </Button>
          )}

          {isSigned && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Printează contractul
            </Button>
          )}
        </div>
      </main>

      {/* Confirm accept dialog */}
      <Dialog
        open={confirmAction === "accept"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acceptă contractul</DialogTitle>
            <DialogDescription>
              Ești sigur că dorești să accepți acest contract de închiriere? După acceptare,
              ambele părți vor putea semna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Anulează
            </Button>
            <Button
              onClick={handleAccept}
              disabled={actionLoading === "accept"}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {actionLoading === "accept" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Acceptă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm sign dialog */}
      <Dialog
        open={confirmAction === "sign"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Semnează contractul</DialogTitle>
            <DialogDescription>
              Prin apăsarea butonului confirmi semnarea electronică a contractului de
              închiriere. Când ambele părți semnează, contractul devine activ și anunțul
              va fi marcat ca închiriat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Anulează
            </Button>
            <Button
              onClick={handleSign}
              disabled={actionLoading === "sign"}
            >
              {actionLoading === "sign" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Semnează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
