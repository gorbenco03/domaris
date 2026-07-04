"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  ArrowLeft,
  Loader2,
  CalendarRange,
  Home,
  User,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyContracts,
  getContractPartyName,
  getContractStatusLabel,
  getContractStatusColor,
  RentalContract,
} from "@/lib/contractsApi";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MyContractsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;
    const fetchContracts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getMyContracts();
        setContracts(data);
      } catch (err) {
        console.error("Failed to fetch contracts:", err);
        setError("Nu am putut încărca contractele.");
        toast.error("Eroare la încărcarea contractelor.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchContracts();
  }, [isAuthenticated, isAuthLoading]);

  if (isAuthLoading) {
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
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea contractele tale.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const userId = user ? String(user.id) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Contractele mele</h1>
          <p className="mt-2 text-muted-foreground">
            Contracte de închiriere în calitate de proprietar sau chiriaș.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Încearcă din nou
            </Button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Niciun contract</h2>
            <p className="mt-2 text-muted-foreground">
              Contractele de închiriere vor apărea aici după ce sunt propuse în urma unei vizionări finalizate.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/viewings">Vezi vizionările</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => {
              const isOwner = userId && String(contract.ownerId) === userId;
              const otherParty = isOwner ? contract.seeker : contract.owner;
              const otherPartyName = getContractPartyName(otherParty);
              const otherPartyRole = isOwner ? "Chiriaș" : "Proprietar";

              const startDate = contract.startDate
                ? format(new Date(contract.startDate), "d MMM yyyy", { locale: ro })
                : "—";
              const endDate = contract.endDate
                ? format(new Date(contract.endDate), "d MMM yyyy", { locale: ro })
                : "—";

              return (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="block"
                >
                  <div className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Listing title */}
                        <div className="flex items-center gap-2 mb-1">
                          <Home className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-semibold truncate">
                            {contract.listing?.title ?? "Proprietate"}
                          </span>
                        </div>

                        {/* Address */}
                        {contract.listing?.addressText && (
                          <p className="text-sm text-muted-foreground mb-3 ml-6">
                            {contract.listing.addressText}
                          </p>
                        )}

                        <Separator className="mb-3" />

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          {/* Other party */}
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{otherPartyRole}:</span>
                            <span className="font-medium text-foreground">
                              {otherPartyName}
                            </span>
                          </div>

                          {/* Period */}
                          <div className="flex items-center gap-1.5">
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>
                              {startDate} – {endDate}
                            </span>
                          </div>

                          {/* Rent */}
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-foreground">
                              {contract.monthlyRent.toLocaleString("ro-MD")}{" "}
                              {contract.currency}
                            </span>
                            <span>/lună</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <Badge
                          className={cn(
                            "border-0",
                            getContractStatusColor(contract.status),
                          )}
                        >
                          {getContractStatusLabel(contract.status)}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
