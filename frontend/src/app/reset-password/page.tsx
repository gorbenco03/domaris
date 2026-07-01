"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Lock, Mail, Hash, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, ApiError } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Introdu adresa de email");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Codul trebuie să aibă 6 cifre");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Parolele nu coincid");
      return;
    }

    if (password.length < 8) {
      toast.error("Parola trebuie să aibă minim 8 caractere");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email.trim(), code.trim(), password);
      setSuccess(true);
      toast.success("Parola a fost resetată cu succes!");
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError?.message || "Eroare la resetarea parolei";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
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
            Resetează-ți
            <br />
            parola
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Introdu o parolă nouă pentru contul tău.
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
            {success ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <Check className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">
                  Parola a fost resetată!
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Acum te poți autentifica cu noua parolă.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/auth">Mergi la autentificare</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    Parolă nouă
                  </h2>
                  <p className="text-muted-foreground">
                    Introdu codul de 6 cifre primit pe email și setează o parolă nouă.
                  </p>
                </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="code">Cod de verificare</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="pl-10 tracking-[0.4em]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Parolă nouă</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minim 8 caractere"
                        className="pl-10 pr-10"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmă parola</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repetă parola"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se resetează...
                      </>
                    ) : (
                      "Resetează parola"
                    )}
                  </Button>
                </form>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              <Link
                href="/auth"
                className="hover:text-foreground hover:underline"
              >
                ← Înapoi la autentificare
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
