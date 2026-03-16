"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  Calendar,
  ArrowRight,
  TrendingUp,
  Home,
  Sparkles,
  Shield,
} from "lucide-react";

const posts = [
  {
    id: "ghid-cumparare-apartament-chisinau",
    title: "Ghid complet: Cum să cumperi un apartament în Chișinău",
    excerpt: "Tot ce trebuie să știi despre procesul de achiziție, de la căutare până la actul de proprietate.",
    category: "Ghiduri",
    icon: Home,
    date: "12 martie 2026",
    readTime: "8 min",
  },
  {
    id: "piata-imobiliara-moldova-2026",
    title: "Piața imobiliară din Moldova în 2026: tendințe și previziuni",
    excerpt: "Analiză detaliată a prețurilor, cererii și ofertei pe piața imobiliară din Republica Moldova.",
    category: "Piață",
    icon: TrendingUp,
    date: "8 martie 2026",
    readTime: "6 min",
  },
  {
    id: "cum-folosesti-ai-evaluare-pret",
    title: "Cum să folosești AI-ul RIVA pentru evaluarea prețului proprietății",
    excerpt: "Ghid pas cu pas pentru utilizarea funcției de evaluare automată a prețurilor bazată pe inteligență artificială.",
    category: "Tutorial",
    icon: Sparkles,
    date: "3 martie 2026",
    readTime: "5 min",
  },
  {
    id: "verificare-proprietar-de-ce-conteaza",
    title: "Verificarea proprietarului: de ce contează și cum funcționează",
    excerpt: "Cum sistemul de verificare RIVA te protejează de fraude și asigură tranzacții sigure.",
    category: "Securitate",
    icon: Shield,
    date: "28 februarie 2026",
    readTime: "4 min",
  },
  {
    id: "5-greseli-inchiriere-apartament",
    title: "5 greșeli frecvente la închirierea unui apartament (și cum să le eviți)",
    excerpt: "Sfaturi practice pentru chiriași: ce să verifici, ce întrebări să pui și cum să negociezi.",
    category: "Sfaturi",
    icon: Home,
    date: "22 februarie 2026",
    readTime: "5 min",
  },
  {
    id: "cum-sa-faci-fotografii-bune-anunt",
    title: "Cum să faci fotografii bune pentru anunțul tău imobiliar",
    excerpt: "Sfaturi de fotografie pentru proprietari: iluminare, unghiuri și editare pentru a atrage mai mulți vizitatori.",
    category: "Ghiduri",
    icon: Home,
    date: "15 februarie 2026",
    readTime: "6 min",
  },
];

const categories = ["Toate", "Ghiduri", "Piață", "Tutorial", "Securitate", "Sfaturi"];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 px-4 py-16 text-center text-white lg:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <BookOpen className="h-4 w-4" />
              Blog RIVA
            </div>
            <h1 className="text-4xl font-bold lg:text-5xl">
              Noutăți, ghiduri și sfaturi imobiliare
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Rămâi la curent cu tendințele pieței și învață cum să faci cele mai bune alegeri.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 pt-10 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  i === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Posts Grid */}
        <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Category color bar */}
                <div className="h-1 bg-primary" />

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.readTime} citire</span>
                  </div>

                  <h2 className="mb-2 text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="mb-4 flex-1 text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Citește <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
