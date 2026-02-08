"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { pendingEmail, verifyOtp, resendOtp, isAuthenticated, clearPendingEmail } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Redirect if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      // Give a small delay for session storage to load
      const timer = setTimeout(() => {
        const storedEmail = sessionStorage.getItem("riva_pending_email");
        if (!storedEmail) {
          router.push("/auth");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [pendingEmail, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error("Codul trebuie să aibă 6 cifre");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await verifyOtp(code);
      setVerified(true);
      toast.success("Email verificat cu succes!");
    } catch (error: any) {
      const message = error?.message || "Cod invalid sau expirat";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    try {
      await resendOtp();
      toast.success("Cod retrimis! Verifică-ți emailul.");
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      const message = error?.message || "Eroare la retrimiterea codului";
      toast.error(message);
    }
  };

  const handleGoHome = () => {
    clearPendingEmail();
    router.push("/");
  };

  const getDisplayEmail = () => {
    if (pendingEmail) return pendingEmail;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem("riva_pending_email") || "email-ul tău";
    }
    return "email-ul tău";
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden bg-gradient-to-br from-primary via-primary to-primary/80 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Home className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-wider text-white">
            RIVA
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
            Verifică-ți
            <br />
            adresa de email
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Ți-am trimis un cod de verificare pe email.
          </p>
        </div>

        <p className="text-sm text-white/50">
          © 2024 RIVA. Toate drepturile rezervate.
        </p>
      </div>

      {/* Right side - Verification */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-wider">RIVA</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {verified ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Check className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Email verificat!</h3>
                <p className="mt-2 text-muted-foreground">
                  Contul tău a fost activat cu succes.
                </p>
                <Button onClick={handleGoHome} className="mt-6">
                  Mergi la pagina principală
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">
                    Verifică emailul
                  </h2>
                  <p className="text-muted-foreground">
                    Am trimis un cod de 6 cifre la <strong>{getDisplayEmail()}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  <Button type="submit" size="lg" disabled={isSubmitting || code.length !== 6} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se verifică...
                      </>
                    ) : (
                      "Verifică"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                  Nu ai primit codul?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Retrimite (${resendCooldown}s)` : "Retrimite"}
                  </button>
                </p>

                <p className="text-center text-sm text-muted-foreground">
                  <Link href="/auth" className="hover:text-foreground hover:underline">
                    ← Înapoi la autentificare
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
