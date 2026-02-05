"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setVerified(true);
    setIsLoading(false);
    toast.success("Email verificat cu succes!");
  };

  const handleResend = async () => {
    toast.success("Email retrimis!");
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
                <Button asChild className="mt-6">
                  <Link href="/">Mergi la pagina principală</Link>
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
                    Am trimis un cod de verificare la adresa ta de email.
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Introdu codul de verificare"
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                    {isLoading ? (
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
                    className="text-primary hover:underline"
                  >
                    Retrimite
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
