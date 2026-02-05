"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AddPropertyPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <Plus className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a adăuga o proprietate.
          </p>
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Adaugă anunț</h1>
        <p className="mb-8 text-muted-foreground">Completează informațiile despre proprietatea ta</p>

        <form className="space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Informații de bază</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Titlu anunț</Label>
                <Input id="title" placeholder="ex: Apartament 2 camere, zona centrală" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="type">Tip proprietate</Label>
                <Input id="type" placeholder="Apartament" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="transaction">Tip tranzacție</Label>
                <Input id="transaction" placeholder="Vânzare" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="price">Preț (€)</Label>
                <Input id="price" type="number" placeholder="ex: 85000" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="area">Suprafață (m²)</Label>
                <Input id="area" type="number" placeholder="ex: 75" className="mt-1" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Descriere</h2>
            <Textarea 
              placeholder="Descrie proprietatea în detaliu..." 
              rows={6}
            />
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Încarcă fotografii</h3>
            <p className="mt-1 text-sm text-muted-foreground">Trage și lasă fișierele aici sau click pentru a selecta</p>
            <Button variant="outline" className="mt-4">
              Selectează fișiere
            </Button>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Salvează ciornă</Button>
            <Button>Publică anunțul</Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
