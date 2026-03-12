"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  ArrowLeft,
  Loader2,
  Plus,
  FolderOpen,
  MoreVertical,
  Trash2,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getFavorites,
  getFavoriteLists,
  createFavoriteList,
  deleteFavoriteList,
  FavoriteItem,
  FavoriteList,
} from "@/lib/favoritesApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compare mode
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  // New list dialog
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Fetch lists
  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;
    getFavoriteLists()
      .then(setLists)
      .catch((err) => {
        console.error("Failed to fetch favorite lists:", err);
      });
  }, [isAuthenticated, isAuthLoading]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      setError(null);
      try {
        const params = selectedList ? { listId: selectedList } : undefined;
        const response = await getFavorites(params);
        setFavorites(response.data);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        setError("Nu am putut încărca favoritele tale");
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) fetchFavorites();
  }, [isAuthenticated, isAuthLoading, selectedList]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const list = await createFavoriteList({ name: newListName.trim() });
      setLists((prev) => [...prev, list]);
      setNewListName("");
      setShowNewList(false);
      toast.success(`Lista "${list.name}" a fost creată.`);
    } catch {
      toast.error("Nu am putut crea lista.");
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteFavoriteList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
      if (selectedList === listId) setSelectedList(null);
      toast.success("Lista a fost ștearsă.");
    } catch {
      toast.error("Nu am putut șterge lista.");
    }
  };

  const toggleCompare = (propertyId: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) {
        next.delete(propertyId);
      } else if (next.size < 4) {
        next.add(propertyId);
      } else {
        toast.error("Poți compara maxim 4 proprietăți.");
      }
      return next;
    });
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
          <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a vedea favoritele.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedListObj = lists.find((l) => l.id === selectedList);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Favorite</h1>
            <p className="mt-1 text-muted-foreground">
              {favorites.length} proprietăți salvate
              {selectedListObj && ` în "${selectedListObj.name}"`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={compareMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                if (compareMode) setCompareIds(new Set());
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {compareMode ? `Compară (${compareIds.size})` : "Compară"}
            </Button>
            {compareMode && compareIds.size >= 2 && (
              <Button size="sm" asChild>
                <Link
                  href={`/compare?ids=${Array.from(compareIds).join(",")}`}
                >
                  Vezi comparație
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Lists sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Liste</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowNewList(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedList(null)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                    selectedList === null && "bg-muted font-medium"
                  )}
                >
                  <Heart className="h-4 w-4" />
                  Toate
                </button>
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                      selectedList === list.id && "bg-muted font-medium"
                    )}
                  >
                    <button
                      onClick={() => setSelectedList(list.id)}
                      className="flex flex-1 items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span className="truncate">{list.name}</span>
                      {list.count != null && (
                        <span className="text-xs text-muted-foreground">
                          {list.count}
                        </span>
                      )}
                    </button>
                    {!list.isDefault && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 transition-opacity group-hover:opacity-100">
                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteList(list.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Șterge
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Mobile list selector */}
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            <Button
              variant={selectedList === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedList(null)}
            >
              Toate
            </Button>
            {lists.map((list) => (
              <Button
                key={list.id}
                variant={selectedList === list.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedList(list.id)}
              >
                {list.name}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewList(true)}
            >
              <Plus className="mr-1 h-3 w-3" /> Listă nouă
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-border bg-card py-16 text-center">
                <p className="text-muted-foreground">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Încearcă din nou
                </Button>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {favorites.map((fav) => {
                  const propertyId = fav.property?.id || fav.propertyId;
                  const isSelected = compareIds.has(propertyId);
                  return (
                    <div key={fav.id} className="relative">
                      {compareMode && (
                        <button
                          onClick={() => toggleCompare(propertyId)}
                          className={cn(
                            "absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-white bg-white/80 text-transparent"
                          )}
                        >
                          {isSelected && "✓"}
                        </button>
                      )}
                      <PropertyCard
                        id={propertyId}
                        image={fav.property?.image || ""}
                        price={`${fav.property?.price?.toLocaleString() || 0} €`}
                        priceType="sale"
                        title={fav.property?.title || "Proprietate"}
                        location={[fav.property?.address, fav.property?.city]
                          .filter(Boolean)
                          .join(", ")}
                        rooms={fav.property?.rooms || 0}
                        baths={1}
                        area={fav.property?.surface || fav.property?.area || 0}
                        isFavorite={true}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card py-16 text-center">
                <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">
                  Niciun favorit încă
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Salvează proprietățile care îți plac pentru a le regăsi ușor.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/search">Explorează proprietăți</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New List Dialog */}
      <Dialog open={showNewList} onOpenChange={setShowNewList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creează o listă nouă</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nume</Label>
            <Input
              className="mt-1"
              placeholder="ex: Apartamente preferate"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewList(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreatingList}
            >
              {isCreatingList && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Creează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
