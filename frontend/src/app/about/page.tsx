"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Shield,
  Users,
  TrendingUp,
  Heart,
  MapPin,
  Sparkles,
  Building2,
  CheckCircle,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Transparență totală",
    description: "Fără comisioane ascunse, fără intermediari. Conectăm direct proprietarii cu cei care caută.",
  },
  {
    icon: Users,
    title: "Comunitate de încredere",
    description: "Sistem de verificare a proprietarilor și recenzii reale de la utilizatori.",
  },
  {
    icon: TrendingUp,
    title: "Tehnologie inteligentă",
    description: "AI integrat pentru evaluarea prețurilor, recomandări personalizate și analiză de piață.",
  },
  {
    icon: Heart,
    title: "Centrat pe oameni",
    description: "Fiecare funcție e gândită pentru a simplifica procesul de găsire sau listare a unei locuințe.",
  },
];

const stats = [
  { value: "1,000+", label: "Proprietăți listate" },
  { value: "500+", label: "Utilizatori activi" },
  { value: "50+", label: "Orașe acoperite" },
  { value: "98%", label: "Satisfacție clienți" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-20 text-center text-white lg:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Building2 className="h-4 w-4" />
              Despre RIVA
            </div>
            <h1 className="text-4xl font-bold lg:text-5xl">
              Reimaginăm piața imobiliară din Moldova
            </h1>
            <p className="mt-6 text-lg text-white/80">
              RIVA este prima platformă imobiliară din Moldova care conectează direct proprietarii cu
              cei care caută o locuință, fără intermediari și fără comisioane.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Misiunea noastră</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Credem că găsirea unei locuințe ar trebui să fie simplă, transparentă și accesibilă.
              De aceea am construit RIVA — o platformă care elimină barierele dintre proprietari și
              chiriași/cumpărători, oferind instrumente inteligente bazate pe inteligență artificială
              pentru a lua decizii informate.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Viziunea noastră este să devenim platforma #1 pentru tranzacții imobiliare directe
              în Republica Moldova, extinzându-ne ulterior în toată Europa de Est.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto max-w-6xl px-4 pb-16 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold">Valorile noastre</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <v.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-muted/30 px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-bold text-primary lg:text-4xl">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What makes us different */}
        <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold">Ce ne diferențiază</h2>
          <div className="space-y-4">
            {[
              "Fără comisioane — proprietarii listează gratuit, cumpărătorii caută gratuit",
              "AI integrat — evaluare automată a prețurilor și recomandări inteligente",
              "Verificare proprietari — sistem de KYC pentru transparență",
              "Programare vizionări — calendar integrat cu confirmare în timp real",
              "Mesagerie securizată — comunicare directă fără a expune date personale",
              "Hărți interactive — vizualizare proprietăți pe hartă cu Mapbox",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section className="mx-auto max-w-4xl px-4 pb-16 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            <span>Chișinău, Republica Moldova</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
