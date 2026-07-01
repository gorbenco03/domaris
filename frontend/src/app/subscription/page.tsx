"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Crown,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserSubscription,
  cancelSubscription,
  getTransactionHistory,
  UserSubscription,
  Transaction,
} from "@/lib/monetizationApi";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

export default function SubscriptionPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [sub, txs] = await Promise.all([
          getUserSubscription(),
          getTransactionHistory().catch(() => [] as Transaction[]),
        ]);
        setSubscription(sub);
        setTransactions(txs);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) load();
  }, [isAuthenticated, isAuthLoading]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelSubscription();
      setSubscription((prev) =>
        prev ? { ...prev, status: "CANCELLED", autoRenewal: false } : null
      );
      setShowCancelConfirm(false);
    } catch {
      // silent
    } finally {
      setIsCancelling(false);
    }
  };

  const planBadgeVariant = (code?: string) => {
    if (code === "PREMIUM") return "default";
    if (code === "STANDARD") return "secondary";
    return "outline";
  };

  if (isAuthLoading || isLoading) {
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

  // Monetization disabled at v1
  if (process.env.NEXT_PUBLIC_MONETIZATION_ENABLED !== "true") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Crown className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Abonamentele nu sunt disponibile momentan</h1>
          <p className="mt-2 text-muted-foreground">
            Funcția de abonament va fi disponibilă într-o versiune viitoare a platformei.
          </p>
          <Button asChild className="mt-6">
            <Link href="/profile">Înapoi la profil</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Crown className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
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
      <main className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Profil
          </Link>
        </div>

        <h1 className="mb-8 text-3xl font-bold">Abonament</h1>

        {/* Current plan */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {subscription?.plan?.name ?? "Plan Gratuit"}
                  </h2>
                  <Badge variant={planBadgeVariant(subscription?.plan?.code)}>
                    {subscription?.status ?? "ACTIVE"}
                  </Badge>
                </div>
                {subscription?.endDate && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {subscription.status === "CANCELLED" ? "Expiră" : "Reînnoire"}{" "}
                    {format(new Date(subscription.endDate), "d MMMM yyyy", { locale: ro })}
                  </p>
                )}
              </div>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">
                {subscription?.plan?.code === "FREE" || !subscription
                  ? "Upgrade"
                  : "Schimbă planul"}
              </Link>
            </Button>
          </div>

          {subscription && subscription.status === "ACTIVE" && subscription.plan?.code !== "FREE" && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Facturare {subscription.billingCycle === "ANNUAL" ? "anuală" : "lunară"} —{" "}
                    {subscription.autoRenewal ? "reînnoire automată activă" : "fără reînnoire automată"}
                  </span>
                </div>
              </div>

              {subscription.autoRenewal && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Anulează
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cancel confirmation */}
        {showCancelConfirm && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Anulează abonamentul</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accesul premium va rămâne activ până la{" "}
                  {subscription?.endDate
                    ? format(new Date(subscription.endDate), "d MMMM yyyy", { locale: ro })
                    : "sfârșitul perioadei plătite"}
                  . După aceea, contul va fi retrogradat la planul Gratuit.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmă anularea
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCancelConfirm(false)}
                  >
                    Renunță
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Istoric plăți</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nicio tranzacție înregistrată
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-4 px-6 py-4">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      tx.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-600"
                        : tx.status === "FAILED"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tx.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">
                      {tx.description ?? tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "d MMM yyyy", { locale: ro })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {tx.amount} {tx.currency}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        tx.status === "COMPLETED"
                          ? "text-emerald-600"
                          : tx.status === "FAILED"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      )}
                    >
                      {tx.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
