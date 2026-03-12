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
  const [isPromoting, setIsPromoting] = useState(false);

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
          setSelectedPlan(promotionPlans[0].id);
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

  const handlePromote = async () => {
    if (!selectedPlan || !id) return;
    setIsPromoting(true);
    try {
      await promoteProperty(Number(id), selectedPlan);
      toast.success("Anunțul a fost promovat cu succes!");
      router.push("/my-properties");
    } catch {
      toast.error("Nu am putut promova anunțul.");
    } finally {
      setIsPromoting(false);
    }
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

  const selected = plans.find((p) => p.id === selectedPlan);

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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border-2 bg-card p-5 text-left transition-all",
                  selectedPlan === plan.id
                    ? "border-primary shadow-md"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  {plan.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan.duration} zile
                    {plan.boostAmount
                      ? ` · ${plan.boostAmount}x vizibilitate`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    {plan.price} {plan.currency}
                  </p>
                </div>
              </button>
            ))}
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
            onClick={handlePromote}
            disabled={isPromoting}
            className="w-full"
            size="lg"
          >
            {isPromoting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Zap className="mr-2 h-5 w-5" />
            )}
            Promovează pentru {selected.price} {selected.currency}
          </Button>
        )}
      </main>
      <Footer />
    </div>
  );
}
