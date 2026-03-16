"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Termeni și Condiții</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Această pagină va fi completată în curând cu termenii și condițiile de utilizare a platformei RIVA.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Ultima actualizare: În curs de redactare
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
