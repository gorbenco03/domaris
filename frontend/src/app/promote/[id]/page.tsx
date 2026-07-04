"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Zap,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyDetail, PropertyListing } from "@/lib/propertiesApi";
import {
  getPromotionPlans,
  promoteProperty,
  PromotionPlan,
} from "@/lib/monetizationApi";
import { PaymentModal } from "@/components/PaymentModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PromotePropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !id) return;
      setIsLoading(true);
      try {
        const [p, promotionPlans] = await Promise.all([
          getPropertyDetail(id),
          getPromotionPlans(),
        ]);
        setProperty(p);
        setPlans(promotionPlans);
        if (promotionPlans.length > 0) {
          setSelectedPlan(promotionPlans[0].code ?? String(promotionPlans[0].id));
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        toast.error("Nu am putut încărca datele.");
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetchData();
  }, [id, isAuthenticated, isAuthLoading]);

  const selected = plans.find(
    (p) => (p.code ?? String(p.id)) === selectedPlan,
  );

  const handleOpenPayment = () => {
    if (!selected || !id) return;
    setIsPaymentOpen(true);
  };

  const handlePay = async () => {
    if (!selected || !id) throw new Error("Plan sau anunț lipsă");
    const code = selected.code ?? String(selected.id);
    await promoteProperty(Number(id), code, "simulated");
  };

  const handleSuccess = () => {
    router.push("/my-properties");
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Autentificare necesară</h1>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
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
          <Zap className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Promovarea nu este disponibilă momentan</h1>
          <p className="mt-2 text-muted-foreground">
            Funcția de promovare va fi disponibilă într-o versiune viitoare a platformei.
          </p>
          <Button asChild className="mt-6">
            <Link href="/my-properties">Înapoi la proprietăți</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-properties"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la proprietățile mele
          </Link>
        </div>

        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
            <Zap className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Promovează anunțul</h1>
            {property && (
              <p className="text-muted-foreground">{property.title}</p>
            )}
          </div>
        </div>

        <p className="mb-8 text-muted-foreground">
          Alege un plan de promovare pentru a crește vizibilitatea anunțului tău.
        </p>

        {/* Benefits */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: TrendingUp,
              title: "Vizibilitate crescută",
              desc: "Anunțul tău apare în topul rezultatelor",
            },
            {
              icon: Zap,
              title: "Mai multe vizualizări",
              desc: "Până la 10x mai multe vizite",
            },
            {
              icon: CheckCircle,
              title: "Badge de promovat",
              desc: "Evidențiat cu badge special",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-4 text-center"
            >
              <Icon className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        {plans.length > 0 ? (
          <div className="mb-8 space-y-3">
            {plans.map((plan) => {
              const planCode = plan.code ?? String(plan.id);
              const days = plan.durationDays ?? plan.duration;
              return (
                <button
                  key={planCode}
                  onClick={() => setSelectedPlan(planCode)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border-2 bg-card p-5 text-left transition-all",
                    selectedPlan === planCode
                      ? "border-primary shadow-md"
                      : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    {plan.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    )}
                    {plan.impactText && (
                      <p className="mt-0.5 text-xs font-medium text-orange-500">
                        {plan.impactText}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {days} zile
                      {plan.boostAmount
                        ? ` · ${plan.boostAmount}x vizibilitate`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xl font-bold text-primary">
                      {plan.price} {plan.currency}
                    </p>
                    {plan.isPopular && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        Popular
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-border bg-card py-12 text-center">
            <p className="text-muted-foreground">
              Nu sunt disponibile planuri de promovare momentan.
            </p>
          </div>
        )}

        {/* CTA */}
        {selected && (
          <Button
            onClick={handleOpenPayment}
            className="w-full"
            size="lg"
          >
            <Zap className="mr-2 h-5 w-5" />
            Promovează pentru {selected.price} {selected.currency}
          </Button>
        )}
      </main>
      <Footer />

      {/* Payment Modal */}
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        plan={
          selected
            ? {
                name: selected.name,
                price: selected.price,
                currency: selected.currency,
                description: selected.description,
                durationLabel: `${selected.durationDays ?? selected.duration} zile de promovare`,
              }
            : null
        }
        onPay={handlePay}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
