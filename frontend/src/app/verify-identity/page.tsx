"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import kycApi, { IdDocType, KycStatus } from "@/lib/kycApi";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: IdDocType; label: string }[] = [
  { value: "ID_CARD", label: "Carte de identitate" },
  { value: "PASSPORT", label: "Pașaport" },
  { value: "DRIVING_LICENSE", label: "Permis auto" },
];

// ─────────────────────────────────────────────────────────────────────────────
// File upload card
// ─────────────────────────────────────────────────────────────────────────────

function FileUploadCard({
  title,
  hint,
  file,
  onChange,
  onRemove,
  required,
}: {
  title: string;
  hint?: string;
  file: File | null;
  onChange: (f: File) => void;
  onRemove: () => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {title}
          {required && <span className="ml-1 text-destructive">*</span>}
        </span>
      </div>
      {hint && (
        <p className="mb-3 text-xs text-muted-foreground">{hint}</p>
      )}

      {file ? (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          {file.type.startsWith("image/") && (
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-14 w-14 rounded-md object-cover"
            />
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
          Alege fișier
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

export default function VerifyIdentityPage() {
  const [docType, setDocType] = useState<IdDocType | null>(null);
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack, setDocBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<KycStatus | null>(null);

  const isReady = !!docType && !!docFront && !!selfie && !isSubmitting && !result;

  const handleSubmit = async () => {
    if (!docType || !docFront || !selfie) {
      toast.error("Completează toate câmpurile obligatorii.");
      return;
    }

    setIsSubmitting(true);
    try {
      const status = await kycApi.verifyId({
        docType,
        docFront,
        docBack: docBack ?? undefined,
        selfie,
      });
      setResult(status);
      toast.success("Documentele au fost trimise cu succes!");
    } catch (err: any) {
      console.error("KYC verify-id error", err);
      toast.error(err?.message ?? "Nu am putut trimite documentele. Încearcă din nou.");
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <ShieldCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Verificare trimisă!</h1>
          <p className="mb-4 text-muted-foreground">
            Documentele au fost încărcate. Deoarece verificarea automată este activă,
            nivelul tău a fost actualizat imediat.
          </p>
          <div className="mb-8">
            <LevelBadge level={result.verificationLevel} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/settings">Înapoi la setări</Link>
            </Button>
            {result.verificationLevel < 3 && (
              <Button asChild>
                <Link href="/verify-ownership">Verifică proprietatea (Nivel 3)</Link>
              </Button>
            )}
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

        <h1 className="mb-1 text-2xl font-bold">Verificare identitate</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Nivelul 2 — Încarcă documentul de identitate și un selfie pentru a-ți verifica
          identitatea. Este necesar pentru a trimite mesaje și a cere vizionări.
        </p>

        {/* Info card */}
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/40">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Nivel 2 — Identitate verificată
            </span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Fișierele sunt procesate în mod securizat și nu sunt partajate cu terți.
            Dimensiune maximă per fișier: 10 MB (JPEG, PNG, WebP, PDF).
          </p>
        </div>

        <div className="space-y-5">
          {/* Doc type */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Tip document <span className="text-destructive">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDocType(value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    docType === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Selectează documentul pe care îl vei încărca.
            </p>
          </div>

          {/* Uploads */}
          <FileUploadCard
            title="Față document"
            hint="Clar, fără reflexii sau tăieturi. Toate datele vizibile."
            file={docFront}
            onChange={setDocFront}
            onRemove={() => setDocFront(null)}
            required
          />

          <FileUploadCard
            title="Verso document (opțional)"
            hint="Dacă documentul are informații pe spate (ex: cartea de identitate)."
            file={docBack}
            onChange={setDocBack}
            onRemove={() => setDocBack(null)}
          />

          <FileUploadCard
            title="Selfie cu documentul"
            hint="Fața ta vizibilă, ținând documentul în cadru. Lumină bună."
            file={selfie}
            onChange={setSelfie}
            onRemove={() => setSelfie(null)}
            required
          />

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
                Trimite pentru verificare
              </>
            )}
          </Button>

          {!isReady && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground">
              Selectează tipul documentului, încarcă fața și selfie-ul pentru a continua.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
