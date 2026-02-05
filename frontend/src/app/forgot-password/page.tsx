"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSent(true);
    setIsLoading(false);
    toast.success("Email trimis!", {
      description: "Verifică-ți inbox-ul pentru instrucțiuni.",
    });
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
            Recuperează-ți
            <br />
            accesul
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Îți vom trimite un link pentru a-ți reseta parola.
          </p>
        </div>

        <p className="text-sm text-white/50">
          © 2024 RIVA. Toate drepturile rezervate.
        </p>
      </div>

      {/* Right side - Form */}
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
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                Ai uitat parola?
              </h2>
              <p className="text-muted-foreground">
                Introdu adresa de email și îți vom trimite un link pentru resetare.
              </p>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <Mail className="mx-auto h-16 w-16 text-accent" />
                <h3 className="mt-4 text-xl font-semibold">Email trimis!</h3>
                <p className="mt-2 text-muted-foreground">
                  Am trimis un email la <strong>{email}</strong> cu instrucțiuni pentru resetarea parolei.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/auth">Înapoi la autentificare</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nume@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    "Trimite link de resetare"
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/auth" className="hover:text-foreground hover:underline">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                Înapoi la autentificare
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
