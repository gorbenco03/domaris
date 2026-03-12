"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Plus,
  ArrowLeft,
  Loader2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  EyeOff,
  Megaphone,
  MapPin,
  BedDouble,
  Maximize2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyProperties,
  deleteProperty,
  updatePropertyStatus,
  getPropertyAnalytics,
  PropertyListing,
  PropertyStatus,
} from "@/lib/propertiesApi";
import { toast } from "sonner";

interface PropertyWithStats extends PropertyListing {
  stats?: {
    views: number;
    favorites: number;
    messages: number;
    viewings: number;
  };
}

const statusConfig: Record<PropertyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Activ", variant: "default" },
  HIDDEN: { label: "Ascuns", variant: "secondary" },
  DRAFT: { label: "Ciornă", variant: "outline" },
  RENTED: { label: "Închiriat", variant: "secondary" },
  SOLD: { label: "Vândut", variant: "secondary" },
};

export default function MyPropertiesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getMyProperties();
        setProperties(data);

        // Fetch stats for each property in parallel
        const statsPromises = data.map(async (p) => {
          try {
            const stats = await getPropertyAnalytics(p.id, "30d");
            return { id: p.id, stats };
          } catch {
            return { id: p.id, stats: undefined };
          }
        });

        const results = await Promise.allSettled(statsPromises);
        setProperties(prev =>
          prev.map(p => {
            const result = results.find(r =>
              r.status === "fulfilled" && r.value.id === p.id
            );
            if (result?.status === "fulfilled" && result.value.stats) {
              return { ...p, stats: result.value.stats };
            }
            return p;
          })
        );
      } catch (err) {
        console.error("Failed to fetch my properties:", err);
        setError("Nu am putut încărca proprietățile tale");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchProperties();
    }
  }, [isAuthenticated, isAuthLoading]);

  const handleToggleStatus = async (propertyId: number, currentStatus: PropertyStatus) => {
    const newStatus: PropertyStatus = currentStatus === "ACTIVE" ? "HIDDEN" : "ACTIVE";
    try {
      const updated = await updatePropertyStatus(propertyId, newStatus);
      setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, status: updated.status } : p));
      toast.success(newStatus === "ACTIVE" ? "Anunțul este acum activ" : "Anunțul a fost ascuns");
    } catch {
      toast.error("Nu am putut actualiza statusul.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteProperty(deleteTarget);
      setProperties(prev => prev.filter(p => p.id !== deleteTarget));
      toast.success("Anunțul a fost șters.");
    } catch {
      toast.error("Nu am putut șterge anunțul.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

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
          <Home className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea proprietățile tale.
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
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Proprietățile mele</h1>
            <p className="mt-1 text-muted-foreground">{properties.length} anunțuri</p>
          </div>
          <Button asChild>
            <Link href="/add-property">
              <Plus className="mr-2 h-4 w-4" />
              Adaugă anunț
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Încearcă din nou</Button>
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => {
              const sc = statusConfig[property.status] || statusConfig.DRAFT;
              return (
                <div key={property.id} className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Image */}
                    <Link href={`/property/${property.id}`} className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
                      {property.images?.[0]?.url ? (
                        <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Home className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Badge variant={sc.variant} className="absolute left-2 top-2">{sc.label}</Badge>
                    </Link>

                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/property/${property.id}`} className="hover:underline">
                              <h3 className="text-lg font-semibold text-foreground line-clamp-1">{property.title}</h3>
                            </Link>
                            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}</span>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/edit-property/${property.id}`}>
                                  <Edit className="mr-2 h-4 w-4" /> Editează
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/my-properties/${property.id}/analytics`}>
                                  <BarChart3 className="mr-2 h-4 w-4" /> Statistici
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(property.id, property.status)}>
                                {property.status === "ACTIVE" ? (
                                  <><EyeOff className="mr-2 h-4 w-4" /> Ascunde</>
                                ) : (
                                  <><Eye className="mr-2 h-4 w-4" /> Activează</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(property.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Șterge
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-xl font-bold text-primary">
                            {property.priceEur.toLocaleString()} €
                            {property.transactionType === "RENT" && (
                              <span className="text-sm font-normal text-muted-foreground">/lună</span>
                            )}
                          </span>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {property.rooms}</span>
                            <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" /> {property.surfaceSqm} m²</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Vizualizări (30 zile)">
                          <Eye className="h-4 w-4" /><span>{property.stats?.views ?? property.viewCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Favorite">
                          <Heart className="h-4 w-4" /><span>{property.stats?.favorites ?? property.favoriteCount ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Mesaje">
                          <MessageCircle className="h-4 w-4" /><span>{property.stats?.messages ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Vizionări">
                          <Calendar className="h-4 w-4" /><span>{property.stats?.viewings ?? 0}</span>
                        </div>
                        {property.isPromoted && (
                          <div className="ml-auto flex items-center gap-1 text-sm text-amber-500">
                            <Megaphone className="h-4 w-4" /><span>Promovat</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Home className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Nicio proprietate încă</h2>
            <p className="mt-2 text-muted-foreground">Adaugă prima ta proprietate pentru a începe.</p>
            <Button asChild className="mt-6">
              <Link href="/add-property">
                <Plus className="mr-2 h-4 w-4" /> Adaugă proprietate
              </Link>
            </Button>
          </div>
        )}
      </main>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>Această acțiune nu poate fi anulată. Anunțul va fi șters permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
