"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Briefcase, Mail } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-20 text-center text-white lg:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Briefcase className="h-4 w-4" />
              Cariere la RIVA
            </div>
            <h1 className="text-4xl font-bold lg:text-5xl">
              Construiește viitorul imobiliar cu noi
            </h1>
            <p className="mt-6 text-lg text-white/80">
              Suntem o echipă tânără care transformă piața imobiliară din Moldova.
            </p>
          </div>
        </section>

        {/* No open positions */}
        <section className="mx-auto max-w-2xl px-4 py-20 lg:px-8 text-center">
          <div className="rounded-2xl border border-border bg-card p-12">
            <Briefcase className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-bold">
              Momentan nu avem poziții deschise
            </h2>
            <p className="mt-3 text-muted-foreground">
              Revino în curând sau trimite-ne CV-ul tău și te vom contacta când apare o oportunitate.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <a href="mailto:careers@riva.md">
                <Mail className="mr-2 h-4 w-4" />
                Trimite CV-ul la careers@riva.md
              </a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
