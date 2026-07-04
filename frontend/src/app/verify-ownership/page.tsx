"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Loader2, X, Upload, Home } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import kycApi, { PropertyDocType, KycStatus } from "@/lib/kycApi";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: PropertyDocType; label: string; hint: string }[] = [
  {
    value: "PROPERTY_DEED",
    label: "Act de proprietate",
    hint: "Extras de carte funciară, contract de vânzare-cumpărare etc.",
  },
  {
    value: "UTILITY_BILL",
    label: "Factură utilități",
    hint: "Factură recentă la curent, gaze sau apă pe numele tău.",
  },
  {
    value: "OTHER",
    label: "Alt document",
    hint: "Orice alt document care dovedește proprietatea.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// File upload card
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadCard({
  file,
  onChange,
  onRemove,
}: {
  file: File | null;
  onChange: (f: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          Document proprietate <span className="text-destructive">*</span>
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Fișier PDF sau imagine. Maxim 10 MB.
      </p>

      {file ? (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          {file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-14 w-14 rounded-md object-cover"
            />
          )}
          {file.type === "application/pdf" && (
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/40">
              <FileText className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
            aria-label="Elimină fișierul"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <Upload className="h-4 w-4" />
          Alege fișier (imagine sau PDF)
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Level badge
// ─────────────────────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    0: "bg-muted text-muted-foreground",
    1: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    2: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    3: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  const labels: Record<number, string> = {
    0: "Neverificat",
    1: "Email verificat",
    2: "Identitate verificată",
    3: "Proprietar verificat",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        colors[level] ?? colors[0]
      )}
    >
      Nivel {level} — {labels[level] ?? "Necunoscut"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function VerifyOwnershipPage() {
  const [docType, setDocType] = useState<PropertyDocType | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<KycStatus | null>(null);

  const isReady = !!docType && !!documentFile && !isSubmitting && !result;

  const handleSubmit = async () => {
    if (!docType || !documentFile) {
      toast.error("Alege tipul documentului și încarcă fișierul.");
      return;
    }

    const parsedPropertyId = propertyId ? parseInt(propertyId, 10) : undefined;
    if (propertyId && isNaN(parsedPropertyId!)) {
      toast.error("ID-ul proprietății trebuie să fie un număr.");
      return;
    }

    setIsSubmitting(true);
    try {
      const status = await kycApi.submitPropertyDoc({
        docType,
        file: documentFile,
        propertyId: parsedPropertyId,
      });
      setResult(status);
      toast.success("Documentul a fost trimis cu succes!");
    } catch (err: any) {
      console.error("KYC property-doc error", err);
      const msg = err?.message ?? "Nu am putut trimite documentul. Încearcă din nou.";
      if (msg.toLowerCase().includes("identity")) {
        toast.error("Trebuie să îți verifici mai întâi identitatea (Nivel 2).");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <Home className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Document trimis!</h1>
          <p className="mb-4 text-muted-foreground">
            Documentul de proprietate a fost încărcat. Nivelul tău a fost actualizat.
          </p>
          <div className="mb-8">
            <LevelBadge level={result.verificationLevel} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/settings">Înapoi la setări</Link>
            </Button>
            <Button asChild>
              <Link href="/add-property">Adaugă un anunț</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la setări
          </Link>
        </div>

        <h1 className="mb-1 text-2xl font-bold">Verificare proprietar</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Nivelul 3 — Încarcă un document care dovedește că deții proprietatea.
          Necesar pentru a publica anunțuri pe platformă.
        </p>

        {/* Info card */}
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Nivel 3 — Proprietar verificat
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Necesită Nivelul 2 (identitate verificată). Documentele sunt procesate
            securizat și nu sunt partajate cu terți.
          </p>
        </div>

        <div className="space-y-5">
          {/* Doc type selector */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Tip document <span className="text-destructive">*</span>
            </p>
            <div className="space-y-2">
              {DOC_TYPES.map(({ value, label, hint }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDocType(value)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    docType === value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      docType === value ? "text-primary" : "text-foreground"
                    )}
                  >
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <FileUploadCard
            file={documentFile}
            onChange={setDocumentFile}
            onRemove={() => setDocumentFile(null)}
          />

          {/* Optional property ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              ID proprietate (opțional)
            </label>
            <Input
              type="number"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="ex: 123 — dacă anunțul există deja"
              min={1}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Completează dacă ai deja un anunț creat și vrei să îl asociezi.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isReady}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se trimite...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Trimite documentul
              </>
            )}
          </Button>

          {!isReady && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground">
              Alege tipul documentului și încarcă fișierul pentru a continua.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
