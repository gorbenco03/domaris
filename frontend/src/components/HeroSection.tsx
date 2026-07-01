"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(213,50%,25%)] py-16 lg:py-24">
      {/* Decorative circles */}
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
      
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Găsește-ți casa visurilor
            </h1>
            <p className="mb-8 text-lg text-white/80 sm:text-xl">
              Direct de la proprietari, fără comisioane. Proprietăți disponibile în Republica Moldova.
            </p>

            {/* AI Search CTA */}
            <Link href="/search" className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[hsl(158,64%,35%)] to-[hsl(158,64%,52%)] p-1 pr-2 transition-transform hover:scale-105">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">Întreabă AI-ul nostru</p>
                <p className="text-xs text-white/70">"Vreau un apartament cu 2 camere în Chișinău"</p>
              </div>
              <ArrowRight className="ml-2 h-5 w-5 text-white" />
            </Link>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link href="/search">
                  Explorează proprietăți
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/add-property">Adaugă anunț gratuit</Link>
              </Button>
            </div>
          </div>

          {/* Platform highlights — no fabricated statistics */}
          <div className="grid grid-cols-3 gap-4 lg:gap-6">
            {[
              { icon: "🏠", label: "P2P" , sublabel: "Direct proprietar" },
              { icon: "🔒", label: "KYC", sublabel: "Anunțuri verificate" },
              { icon: "🇲🇩", label: "Moldova", sublabel: "Toate regiunile" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
                <p className="text-3xl mb-1">{item.icon}</p>
                <p className="text-lg font-bold text-white">{item.label}</p>
                <p className="text-xs text-white/70">{item.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
