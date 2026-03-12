"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPropertyDetail, PropertyListing } from "@/lib/propertiesApi";
import { cn } from "@/lib/utils";

function CompareContent() {
  const searchParams = useSearchParams();
  const { isLoading: isAuthLoading } = useAuth();

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (!idsParam) return;

    const ids = idsParam.split(",").slice(0, 4);
    setIsLoading(true);

    Promise.all(ids.map((id) => getPropertyDetail(id).catch(() => null)))
      .then((results) => {
        setProperties(
          results.filter((r): r is PropertyListing => r !== null)
        );
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  if (isAuthLoading || isLoading) {
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

  if (properties.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Selectează cel puțin 2 proprietăți</h1>
          <p className="mt-2 text-muted-foreground">
            Mergi la favorite și selectează proprietățile pe care dorești să le compari.
          </p>
          <Button asChild className="mt-6">
            <Link href="/favorites">Înapoi la favorite</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const BoolIcon = ({ value }: { value?: boolean }) =>
    value ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );

  const rows: {
    label: string;
    render: (p: PropertyListing) => React.ReactNode;
  }[] = [
    {
      label: "Preț",
      render: (p) => (
        <span className="text-lg font-bold text-primary">
          {(p.priceEur ?? 0).toLocaleString()} €
        </span>
      ),
    },
    {
      label: "Preț / m²",
      render: (p) =>
        p.surfaceSqm
          ? `${Math.round((p.priceEur ?? 0) / p.surfaceSqm).toLocaleString()} €/m²`
          : "—",
    },
    { label: "Tip", render: (p) => p.propertyType },
    { label: "Tranzacție", render: (p) => (p.transactionType === "RENT" ? "Închiriere" : "Vânzare") },
    { label: "Suprafață", render: (p) => (p.surfaceSqm ? `${p.surfaceSqm} m²` : "—") },
    { label: "Camere", render: (p) => p.rooms ?? "—" },
    { label: "Băi", render: (p) => p.bathrooms ?? "—" },
    { label: "Etaj", render: (p) => (p.floor != null ? `${p.floor}/${p.totalFloors || "?"}` : "—") },
    { label: "An construcție", render: (p) => p.yearBuilt ?? "—" },
    { label: "Oraș", render: (p) => p.city },
    { label: "Cartier", render: (p) => p.neighborhood || "—" },
    { label: "Mobilat", render: (p) => <BoolIcon value={p.isFurnished} /> },
    { label: "Centrală", render: (p) => <BoolIcon value={p.hasCentralHeating} /> },
    { label: "Parcare", render: (p) => <BoolIcon value={p.hasParking} /> },
    { label: "Balcon", render: (p) => <BoolIcon value={p.hasBalcony} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href="/favorites"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la favorite
          </Link>
        </div>

        <h1 className="mb-8 text-3xl font-bold">Compară proprietăți</h1>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[600px]">
            {/* Header with images */}
            <thead>
              <tr className="border-b border-border">
                <th className="w-36 p-4 text-left text-sm font-medium text-muted-foreground" />
                {properties.map((p) => (
                  <th key={p.id} className="p-4 text-left">
                    <div className="space-y-2">
                      {p.images?.[0] && (
                        <img
                          src={p.images[0].url}
                          alt=""
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      )}
                      <Link
                        href={`/property/${p.id}`}
                        className="flex items-center gap-1 text-sm font-semibold hover:text-primary"
                      >
                        {p.title}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, render }, i) => (
                <tr
                  key={label}
                  className={cn(
                    "border-b border-border",
                    i % 2 === 0 && "bg-muted/30"
                  )}
                >
                  <td className="p-4 text-sm font-medium text-muted-foreground">
                    {label}
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-sm">
                      {render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
