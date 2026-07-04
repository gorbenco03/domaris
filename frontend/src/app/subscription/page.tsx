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
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserSubscription,
  cancelSubscription,
  getTransactionHistory,
  getSubscriptionPlans,
  createSubscription,
  UserSubscription,
  Transaction,
  SubscriptionPlan,
} from "@/lib/monetizationApi";
import { PaymentModal } from "@/components/PaymentModal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Payment modal state
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [sub, txs, subPlans] = await Promise.all([
          getUserSubscription(),
          getTransactionHistory().catch(() => [] as Transaction[]),
          getSubscriptionPlans().catch(() => [] as SubscriptionPlan[]),
        ]);
        setSubscription(sub);
        setTransactions(txs);
        // Filter out free plan from the selectable list
        setPlans(subPlans.filter((p) => p.code?.toUpperCase() !== "FREE"));
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
        prev ? { ...prev, status: "cancelled" as const, autoRenew: false, autoRenewal: false } : null,
      );
      setShowCancelConfirm(false);
      toast.success("Abonamentul a fost anulat.");
    } catch {
      toast.error("Nu am putut anula abonamentul.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenPayment = (plan: SubscriptionPlan, cycle: "monthly" | "yearly") => {
    setSelectedPlan(plan);
    setSelectedCycle(cycle);
    setIsPaymentOpen(true);
  };

  const handlePay = async () => {
    if (!selectedPlan) throw new Error("Plan lipsă");
    await createSubscription({
      planCode: selectedPlan.code,
      billingCycle: selectedCycle,
      paymentMethod: "simulated",
    });
  };

  const handlePaySuccess = () => {
    // Reload subscription data and hide plan cards if now subscribed
    setIsLoading(true);
    Promise.all([
      getUserSubscription(),
      getTransactionHistory().catch(() => [] as Transaction[]),
    ])
      .then(([sub, txs]) => {
        setSubscription(sub);
        setTransactions(txs);
        toast.success("Abonamentul a fost activat cu succes!");
      })
      .finally(() => setIsLoading(false));
  };

  const planBadgeVariant = (code?: string) => {
    const upper = code?.toUpperCase();
    if (upper === "PREMIUM") return "default" as const;
    if (upper === "STANDARD") return "secondary" as const;
    return "outline" as const;
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

  // Monetization gate
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
                {(subscription?.currentPeriodEnd ?? subscription?.endDate) && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(subscription.status === "CANCELLED" || subscription.status === "cancelled") ? "Expiră" : "Reînnoire"}{" "}
                    {format(new Date((subscription.currentPeriodEnd ?? subscription.endDate)!), "d MMMM yyyy", { locale: ro })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {subscription && (subscription.status === "ACTIVE" || subscription.status === "active" || subscription.status === "trialing") && subscription.plan?.code?.toUpperCase() !== "FREE" && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 text-sm">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Facturare {(subscription.billingCycle === "ANNUAL" || subscription.billingCycle === "yearly") ? "anuală" : "lunară"} —{" "}
                    {(subscription.autoRenew ?? subscription.autoRenewal) ? "reînnoire automată activă" : "fără reînnoire automată"}
                  </span>
                </div>
              </div>

              {(subscription.autoRenew ?? subscription.autoRenewal) && (
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
                  {(subscription?.currentPeriodEnd ?? subscription?.endDate)
                    ? format(new Date((subscription.currentPeriodEnd ?? subscription.endDate)!), "d MMMM yyyy", { locale: ro })
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

        {/* Plan selection — shown when no active paid subscription */}
        {(!subscription ||
          ["CANCELLED", "cancelled", "EXPIRED", "expired"].includes(subscription.status) ||
          subscription.plan?.code?.toUpperCase() === "FREE") && plans.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Alege un plan</h2>
            </div>

            <div className="space-y-3">
              {plans.map((plan) => {
                const monthlyPrice = plan.priceMonthly ?? plan.price ?? 0;
                const yearlyPrice = plan.priceYearly ?? plan.annualPrice;
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-2xl border-2 bg-card p-5 transition-all",
                      plan.isPopular ? "border-primary shadow-md" : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{plan.name}</h3>
                          {plan.isPopular && (
                            <Badge variant="default" className="text-xs">
                              Popular
                            </Badge>
                          )}
                        </div>
                        {plan.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                        )}
                        {plan.features && plan.features.length > 0 && (
                          <ul className="mt-2 space-y-0.5">
                            {plan.features.slice(0, 3).map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        )}
                        {plan.trialDays && plan.trialDays > 0 && (
                          <p className="mt-2 text-xs font-medium text-emerald-600">
                            {plan.trialDays} zile gratuit
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {monthlyPrice} {plan.currency}
                            <span className="text-sm font-normal text-muted-foreground">/lună</span>
                          </p>
                          {yearlyPrice && (
                            <p className="text-xs text-muted-foreground">
                              sau {yearlyPrice} {plan.currency}/an
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPayment(plan, "monthly")}
                          >
                            Lunar
                          </Button>
                          {yearlyPrice && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPayment(plan, "yearly")}
                            >
                              Anual
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tx.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
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
                            : "text-muted-foreground",
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

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        plan={
          selectedPlan
            ? {
                name: selectedPlan.name,
                price:
                  selectedCycle === "yearly"
                    ? (selectedPlan.priceYearly ?? selectedPlan.annualPrice ?? selectedPlan.priceMonthly ?? selectedPlan.price ?? 0)
                    : (selectedPlan.priceMonthly ?? selectedPlan.price ?? 0),
                currency: selectedPlan.currency,
                description: selectedPlan.description,
                durationLabel: selectedCycle === "yearly" ? "Facturare anuală" : "Facturare lunară",
              }
            : null
        }
        onPay={handlePay}
        onSuccess={handlePaySuccess}
      />
    </div>
  );
}
