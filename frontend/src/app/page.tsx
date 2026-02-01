
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  MapPin, 
  Bell, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  Home, 
  Store, 
  Bookmark 
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// COMPONENT
// ============================================

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 font-sans max-w-md mx-auto md:max-w-full md:border-x md:border-border">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 pt-8 md:pt-6 bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/40 transition-all">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold text-primary tracking-tight">RIVA</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground/80">
              <MapPin size={13} className="text-accent" />
              <span className="text-xs font-medium tracking-wide">România</span>
            </div>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center hover:bg-secondary/20 transition-colors animate-scale-hover">
            <Bell size={18} className="text-secondary" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-destructive border-[1.5px] border-white ring-2 ring-white/20" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar">
          {/* Hero Section */}
          <section className="px-6 pt-6 pb-6 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <h2 className="text-[32px] font-bold text-slate-900 leading-[1.1] mb-2 tracking-tight">
              Găsește-ți <br />
              <span className="text-primary">casa visurilor</span>
            </h2>
            <p className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-[280px]">
              Direct de la proprietari, fără comisioane și bătăi de cap.
            </p>
          </section>

          {/* Quick Categories */}
          <section className="px-6 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="flex justify-between gap-4">
              {[
                { id: 'APARTMENT', label: 'Apartamente', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                { id: 'HOUSE', label: 'Case', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { id: 'COMMERCIAL', label: 'Comercial', icon: Store, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className="flex-1 flex flex-col items-center justify-center py-5 px-3 rounded-2xl bg-white border border-transparent shadow-sm hover:shadow-md transition-all animate-scale-hover group"
                >
                  <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3 border transition-colors group-hover:bg-white", category.bg)}>
                    <category.icon size={26} className={category.color} />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900">{category.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Banner */}
          <section className="px-6 mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="relative w-full overflow-hidden rounded-2xl group cursor-pointer animate-scale-hover shadow-lg shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              
              <div className="relative p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Sparkles size={24} className="text-white shrink-0" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-[17px] tracking-tight">Întreabă AI-ul nostru</span>
                    <span className="text-indigo-50/90 text-[13px] font-medium max-w-[200px] leading-snug">
                      Găsește proprietatea perfectă în câteva secunde
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                  <ChevronRight size={20} className="text-white" />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Filters */}
          <section className="mb-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-6 scroll-smooth">
              {[
                { label: 'Recomandate AI', icon: Sparkles, active: true },
                { label: 'Noi (7 zile)', icon: null }, 
                { label: 'Preț redus', icon: null },
                { label: 'Aproape de metrou', icon: null },
              ].map((filter, idx) => (
                <button
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all whitespace-nowrap active:scale-95",
                    filter.active 
                      ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {filter.icon && <filter.icon size={14} className={filter.active ? "text-indigo-300" : "text-slate-500"} />}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Popular Searches */}
          <section className="px-6 mb-10 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex justify-between items-end mb-5">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Căutări populare</h3>
              <button className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors group">
                <Bookmark size={15} className="group-hover:fill-current transition-all" />
                <span className="text-xs font-semibold uppercase tracking-wide">Salvate</span>
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              {[
                { name: 'București', count: 1240, color: 'bg-blue-500' },
                { name: 'Cluj-Napoca', count: 850, color: 'bg-emerald-500' },
                { name: 'Iași', count: 540, color: 'bg-amber-500' },
                { name: 'Timișoara', count: 420, color: 'bg-purple-500' },
              ].map((city) => (
                <div 
                  key={city.name}
                  className="flex items-center gap-3 p-3.5 pl-4 pr-6 bg-white border border-slate-100 rounded-2xl shadow-sm min-w-max cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all group active:scale-95"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50 transition-colors")}>
                    <MapPin size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[15px] font-semibold text-slate-900">{city.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{city.count} anunțuri</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Listings */}
          <section className="px-6 pb-24 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Adăugate recent</h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wide hover:underline decoration-2 underline-offset-4">
                Vezi toate
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Empty State / Placeholder with nicer look */}
              <div className="py-12 px-8 text-center rounded-3xl bg-slate-50/50 border border-dashed border-slate-200">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Home size={32} />
                 </div>
                 <h4 className="text-slate-900 font-semibold mb-1">Niciun anunț nou</h4>
                 <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Revin-o mai târziu pentru cele mai noi oferte imobiliare.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
