"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Home,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Shield,
  TrendingUp,
} from "lucide-react";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const { login, signup, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "login") {
      try {
        await login(email, password);
        toast.success("Autentificare reușită!");
        router.push("/");
      } catch (error) {
        toast.error("Eroare la autentificare");
      }
    } else {
      if (password !== confirmPassword) {
        toast.error("Parolele nu coincid");
        return;
      }
      if (!acceptTerms) {
        toast.error("Trebuie să accepți termenii și condițiile");
        return;
      }
      try {
        await signup(email, password, name);
        toast.success("Cont creat! Verifică-ți emailul.");
        router.push("/verify-email");
      } catch (error) {
        toast.error("Eroare la crearea contului");
      }
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden bg-gradient-to-br from-primary via-primary to-primary/80 lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Home className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-wider text-white">
            RIVA
          </span>
        </div>

        {/* Hero content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Găsește-ți casa
              <br />
              visurilor tale
            </h1>
            <p className="max-w-md text-lg text-white/70">
              Platformă completă pentru cumpărarea, vânzarea și închirierea
              proprietăților imobiliare din Moldova.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4">
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Mii de proprietăți</p>
                <p className="text-sm text-white/60">
                  Apartamente, case, terenuri și spații comerciale
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Tranzacții sigure</p>
                <p className="text-sm text-white/60">
                  Verificare completă a proprietăților și proprietarilor
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">Analize de piață</p>
                <p className="text-sm text-white/60">
                  Prețuri actuale și tendințe imobiliare
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-white/50">
          © 2024 RIVA. Toate drepturile rezervate.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="flex flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-wider">RIVA</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">
                {isLogin ? "Bine ai revenit" : "Creează cont"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Intră în contul tău pentru a continua"
                  : "Înregistrează-te pentru a accesa toate funcțiile"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                  isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Autentificare
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-colors ${
                  !isLogin
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Înregistrare
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name - Signup only */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nume complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ion Popescu"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Parolă</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isLogin ? "Introdu parola" : "Minim 8 caractere"}
                    className="pl-10 pr-10"
                    required
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

              {/* Confirm Password - Signup only */}
              {!isLogin && (
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              )}

              {/* Terms - Signup only */}
              {!isLogin && (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    className="mt-0.5"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setAcceptTerms(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    Accept{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Termenii și Condițiile
                    </Link>{" "}
                    și{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Politica de Confidențialitate
                    </Link>
                  </Label>
                </div>
              )}

              {/* Forgot Password - Login only */}
              {isLogin && (
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Ai uitat parola?
                  </Link>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : isLogin ? (
                  "Autentifică-te"
                ) : (
                  "Creează cont"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  sau
                </span>
              </div>
            </div>

            {/* Social login placeholder */}
            <Button variant="outline" className="w-full" type="button">
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuă cu Google
            </Button>

            {/* Back to home */}
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground hover:underline">
                ← Înapoi la pagina principală
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
