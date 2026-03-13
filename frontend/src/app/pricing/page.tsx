"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSubscriptionPlans,
  initiatePaynetPayment,
  SubscriptionPlan,
} from "@/lib/monetizationApi";
import { useAuth } from "@/contexts/AuthContext";

const FAQ = [
  {
    q: "Pot anula abonamentul oricând?",
    a: "Da, poți anula abonamentul în orice moment din pagina de setări. Accesul premium rămâne activ până la sfârșitul perioadei plătite.",
  },
  {
    q: "Ce înseamnă acces anticipat (Early Access)?",
    a: "Abonații Premium și Standard văd anunțurile noi cu 12 ore înaintea utilizatorilor fără abonament, oferindu-le un avantaj în piața imobiliară.",
  },
  {
    q: "Cum funcționează plata?",
    a: "Acceptăm plăți prin PAYNET, MAIB și MPAY. Toate tranzacțiile sunt securizate.",
  },
  {
    q: "Pot schimba planul mai târziu?",
    a: "Da, poți face upgrade sau downgrade oricând. La upgrade plătești diferența prorated pentru perioada rămasă.",
  },
  {
    q: "Există perioadă de probă?",
    a: "Poți folosi platforma gratuit nelimitat. Planul gratuit include acces la căutare și vizualizare anunțuri.",
  },
];

// Fallback plans if API is unavailable
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    code: "FREE",
    name: "Gratuit",
    price: 0,
    currency: "EUR",
    billingCycle: "MONTHLY",
    features: [
      "Căutare și vizualizare anunțuri",
      "Salvare favorite (până la 10)",
      "Mesagerie (până la 5 conversații)",
      "Solicitare vizionări",
    ],
  },
  {
    id: "standard",
    code: "STANDARD",
    name: "Standard",
    price: 9,
    annualPrice: 7,
    currency: "EUR",
    billingCycle: "MONTHLY",
    isPopular: true,
    features: [
      "Tot ce include Gratuit",
      "Acces anticipat la anunțuri (Early Access)",
      "Favorite nelimitate",
      "Mesagerie nelimitată",
      "Alerte salvate (alertare instantanee)",
      "Comparare proprietăți",
    ],
  },
  {
    id: "premium",
    code: "PREMIUM",
    name: "Premium",
    price: 19,
    annualPrice: 15,
    currency: "EUR",
    billingCycle: "MONTHLY",
    features: [
      "Tot ce include Standard",
      "Postare anunțuri imobiliare",
      "Promovare anunțuri (boost)",
      "Statistici detaliate",
      "Asistent AI (chat + evaluare prețuri)",
      "Suport prioritar",
    ],
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionPlans()
      .then((data) => {
        if (data.length > 0) setPlans(data);
      })
      .catch(() => {});

    // Fetch current subscription to show which plan is active
    if (isAuthenticated) {
      import("@/lib/monetizationApi").then(({ getUserSubscription }) => {
        getUserSubscription()
          .then((sub) => {
            if (sub?.plan?.code) setCurrentPlanCode(sub.plan.code);
            else setCurrentPlanCode("FREE");
          })
          .catch(() => setCurrentPlanCode("FREE"));
      });
    }
  }, [isAuthenticated]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (plan.code === "FREE") return;
    if (!isAuthenticated) {
      window.location.href = "/auth?redirect=/pricing";
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const cycle = isAnnual ? "ANNUAL" : "MONTHLY";
      const res = await initiatePaynetPayment({ planId: plan.id, billingCycle: cycle });
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        window.location.href = "/subscription";
      }
    } catch {
      window.location.href = "/subscription";
    } finally {
      setLoadingPlanId(null);
    }
  };

  const displayPrice = (plan: SubscriptionPlan) => {
    if (plan.code === "FREE") return "Gratuit";
    const price = isAnnual && plan.annualPrice ? plan.annualPrice : plan.price;
    return `${price} €/lună`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Alege planul potrivit pentru tine
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Accesează mai repede cele mai bune oferte imobiliare
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-muted p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                !isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Lunar
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                isAnnual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Anual
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                plan.isPopular
                  ? "border-primary shadow-lg ring-1 ring-primary"
                  : "border-border"
              )}
            >
              {currentPlanCode === plan.code && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                  Planul tău actual
                </span>
              )}
              {plan.isPopular && currentPlanCode !== plan.code && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Cel mai popular
                </span>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-4 text-3xl font-bold text-foreground">
                  {displayPrice(plan)}
                </p>
                {isAnnual && plan.annualPrice && plan.code !== "FREE" && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Facturat anual ({(plan.annualPrice * 12).toFixed(0)} €/an)
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlanCode === plan.code ? (
                <Button variant="outline" disabled className="w-full">
                  <Check className="mr-2 h-4 w-4" />
                  Plan activ
                </Button>
              ) : plan.code === "FREE" ? (
                <Button variant="outline" asChild>
                  <Link href="/search">Începe gratuit</Link>
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlanId === plan.id}
                  variant={plan.isPopular ? "default" : "outline"}
                  className="w-full"
                >
                  {loadingPlanId === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  {isAuthenticated ? `Alege ${plan.name}` : "Înregistrează-te"}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-bold">Întrebări frecvente</h2>
          <div className="mx-auto max-w-2xl">
            <Accordion type="single" collapsible>
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
