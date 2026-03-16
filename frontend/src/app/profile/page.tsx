"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getMyProperties } from "@/lib/propertiesApi";
import {
  MapPin,
  Calendar,
  Star,
  Home,
  Eye,
  Users,
  ChevronRight,
  Bell,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Sparkles,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [propertyCount, setPropertyCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      try {
        const props = await getMyProperties();
        setPropertyCount(Array.isArray(props) ? props.length : 0);
      } catch {
        setPropertyCount(0);
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, [isAuthenticated]);

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-8">
          <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-muted">
            <Home className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Trebuie să te autentifici
          </h1>
          <p className="text-muted-foreground mb-6">
            Pentru a accesa profilul tău, te rugăm să te autentifici sau să îți creezi un cont.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/auth">Autentifică-te</Link>
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/auth">Creează cont</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stats = [
    { icon: Home, value: isLoadingStats ? "…" : String(propertyCount), label: "Anunțuri" },
    { icon: Eye, value: "—", label: "Vizualizări" },
    { icon: Users, value: "—", label: "Contacte" },
  ];

  const menuItems = [
    { icon: Bell, label: "Notificări", sublabel: "Vezi ultimele noutăți", href: "/notifications" },
    { icon: Home, label: "Proprietățile mele", sublabel: "Gestionează anunțurile", href: "/my-properties" },
    { icon: Heart, label: "Favorite", sublabel: "Proprietăți salvate", href: "/favorites" },
    { icon: Calendar, label: "Vizionări programate", sublabel: "Vezi calendar", href: "/viewings" },
    { icon: Settings, label: "Setări cont", sublabel: "Profil și preferințe", href: "/settings" },
    { icon: HelpCircle, label: "Ajutor & Suport", sublabel: "Centre de ajutor", href: "/help" },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("");
    return initials.toUpperCase() || "U";
  };

  const getFullName = () => {
    return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Utilizator";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        {/* Profile Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(213,50%,25%)]">
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold text-white">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold">{getFullName()}</h1>
                <div className="mt-1 flex flex-col gap-1 text-sm text-white/70 sm:flex-row sm:gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Chișinău, Moldova
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Membru din februarie 2026
                  </span>
                </div>
              </div>
            </div>

            {/* Verified Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Email verificat
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold text-foreground">5.0</span>
            <span className="text-muted-foreground">(0 recenzii)</span>
          </div>
          <Button variant="ghost" size="sm" className="text-accent">
            Vezi
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Activitate RIVA
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-category-houses">
                  <stat.icon className="h-6 w-6 text-category-houses-icon" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Section */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Premium
          </h2>
          <Link
            href="/pricing"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-category-apartments">
                <Sparkles className="h-6 w-6 text-category-apartments-icon" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Planuri de abonament</p>
                <p className="text-sm text-muted-foreground">Vezi toate beneficiile Premium</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Add Listing CTA */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-[hsl(158,64%,45%)] p-6">
          <Link href="/add-property" className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div className="text-white">
                <p className="text-lg font-bold">Adaugă anunț</p>
                <p className="text-sm text-white/80">Publică o proprietate nouă</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-white" />
          </Link>
        </div>

        {/* Activity Menu */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Activitate
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {menuItems.map((item, idx) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between p-4 transition-colors hover:bg-muted ${
                  idx !== menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Deconectează-te
        </Button>
      </main>

      <Footer />
    </div>
  );
}
