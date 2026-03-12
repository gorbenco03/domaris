"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPropertyDetail,
  updateProperty,
  uploadPropertyPhotos,
  deletePropertyImage,
  UpdatePropertyRequest,
  PropertyImage,
} from "@/lib/propertiesApi";
import { generatePropertyDescription } from "@/lib/aiApi";
import { toast } from "sonner";

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Loading states
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState<"RENT" | "SALE">("SALE");
  const [priceEur, setPriceEur] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [rooms, setRooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [surfaceSqm, setSurfaceSqm] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [isFurnished, setIsFurnished] = useState(false);
  const [hasCentralHeating, setHasCentralHeating] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasBalcony, setHasBalcony] = useState(false);

  // Photo state
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);
  const [deleteImageTarget, setDeleteImageTarget] = useState<number | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Fetch existing property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!isAuthenticated || !id) return;
      setIsLoadingProperty(true);
      setLoadError(null);

      try {
        const p = await getPropertyDetail(id);
        setTitle(p.title);
        setDescription(p.description);
        setPropertyType(p.propertyType);
        setTransactionType(p.transactionType);
        setPriceEur(String(p.priceEur));
        setCity(p.city);
        setNeighborhood(p.neighborhood || "");
        setAddress(p.address || "");
        setRooms(String(p.rooms));
        setBathrooms(p.bathrooms ? String(p.bathrooms) : "");
        setSurfaceSqm(String(p.surfaceSqm));
        setFloor(p.floor != null ? String(p.floor) : "");
        setTotalFloors(p.totalFloors != null ? String(p.totalFloors) : "");
        setYearBuilt(p.yearBuilt ? String(p.yearBuilt) : "");
        setIsFurnished(!!p.isFurnished);
        setHasCentralHeating(!!p.hasCentralHeating);
        setHasParking(!!p.hasParking);
        setHasBalcony(!!p.hasBalcony);
        setExistingImages(p.images || []);
      } catch {
        setLoadError("Nu am putut încărca proprietatea.");
      } finally {
        setIsLoadingProperty(false);
      }
    };

    if (!isAuthLoading) {
      fetchProperty();
    }
  }, [id, isAuthenticated, isAuthLoading]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviewUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files);
    setNewFiles((prev) => [...prev, ...arr]);
    setNewPreviewUrls((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviewUrls[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async () => {
    if (deleteImageTarget === null) return;
    setIsDeletingImage(true);
    try {
      await deletePropertyImage(id, deleteImageTarget);
      setExistingImages((prev) => prev.filter((img) => img.id !== deleteImageTarget));
      toast.success("Fotografia a fost ștearsă.");
    } catch {
      toast.error("Nu am putut șterge fotografia.");
    } finally {
      setIsDeletingImage(false);
      setDeleteImageTarget(null);
    }
  };

  const handleGenerateDescription = async () => {
    if (!propertyType || !rooms || !surfaceSqm || !city) {
      toast.error("Completează tipul proprietății, camerele, suprafața și orașul pentru a genera descrierea.");
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const features: string[] = [];
      if (isFurnished) features.push("mobilat");
      if (hasCentralHeating) features.push("centrală termică");
      if (hasParking) features.push("parcare");
      if (hasBalcony) features.push("balcon");

      const result = await generatePropertyDescription({
        propertyType,
        transactionType,
        rooms: parseInt(rooms),
        surfaceSqm: parseFloat(surfaceSqm),
        city,
        neighborhood: neighborhood || undefined,
        features,
      });

      setDescription(result.description);
      if (result.title && !title) {
        setTitle(result.title);
      }
      toast.success("Descrierea a fost generată cu AI.");
    } catch {
      toast.error("Nu am putut genera descrierea.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !priceEur || !rooms || !surfaceSqm) {
      toast.error("Te rugăm să completezi toate câmpurile obligatorii.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: UpdatePropertyRequest = {
        title,
        description,
        priceEur: parseFloat(priceEur),
        city,
        neighborhood: neighborhood || undefined,
        address: address || undefined,
        rooms: parseInt(rooms),
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        surfaceSqm: parseFloat(surfaceSqm),
        floor: floor ? parseInt(floor) : undefined,
        totalFloors: totalFloors ? parseInt(totalFloors) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        isFurnished,
        hasCentralHeating,
        hasParking,
        hasBalcony,
      };

      await updateProperty(id, data);

      // Upload new photos if any
      if (newFiles.length > 0) {
        try {
          await uploadPropertyPhotos(id, newFiles);
        } catch {
          toast.warning("Proprietatea a fost actualizată, dar au apărut erori la încărcarea noilor fotografii.");
        }
      }

      toast.success("Anunțul a fost actualizat cu succes!");
      router.push("/my-properties");
    } catch {
      toast.error("Eroare la actualizarea anunțului.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingProperty) {
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
          <h1 className="mt-4 text-2xl font-bold">Autentificare necesară</h1>
          <p className="mt-2 text-muted-foreground">
            Trebuie să fii autentificat pentru a edita o proprietate.
          </p>
          <Button asChild className="mt-6">
            <Link href="/auth">Autentifică-te</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-muted-foreground">{loadError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Încearcă din nou
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPhotos = existingImages.length + newFiles.length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/my-properties"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la proprietățile mele
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Editează anunțul</h1>
        <p className="mb-8 text-muted-foreground">Modifică informațiile despre proprietatea ta</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Informații de bază</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Titlu anunț *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex: Apartament 2 camere, zona centrală"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="propertyType">Tip proprietate *</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selectează" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENT">Apartament</SelectItem>
                    <SelectItem value="HOUSE">Casă</SelectItem>
                    <SelectItem value="COMMERCIAL">Comercial</SelectItem>
                    <SelectItem value="LAND">Teren</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transactionType">Tip tranzacție *</Label>
                <Select
                  value={transactionType}
                  onValueChange={(v) => setTransactionType(v as "RENT" | "SALE")}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALE">De vânzare</SelectItem>
                    <SelectItem value="RENT">De închiriat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Preț (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={priceEur}
                  onChange={(e) => setPriceEur(e.target.value)}
                  placeholder="ex: 85000"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="surface">Suprafață (m²) *</Label>
                <Input
                  id="surface"
                  type="number"
                  value={surfaceSqm}
                  onChange={(e) => setSurfaceSqm(e.target.value)}
                  placeholder="ex: 75"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rooms">Camere *</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  placeholder="ex: 3"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Băi</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  placeholder="ex: 1"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Locație</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">Oraș *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="ex: Chișinău"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Cartier</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="ex: Centru"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Adresă</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ex: Strada Exemplu nr. 10"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Detalii suplimentare</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="floor">Etaj</Label>
                <Input
                  id="floor"
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="ex: 3"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="totalFloors">Total etaje</Label>
                <Input
                  id="totalFloors"
                  type="number"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  placeholder="ex: 10"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="yearBuilt">An construcție</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                  placeholder="ex: 2015"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFurnished}
                  onChange={(e) => setIsFurnished(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Mobilat</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCentralHeating}
                  onChange={(e) => setHasCentralHeating(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Centrală</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasParking}
                  onChange={(e) => setHasParking(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Parcare</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBalcony}
                  onChange={(e) => setHasBalcony(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Balcon</span>
              </label>
            </div>
          </div>

          {/* Description with AI Generation */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Descriere *</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDesc}
              >
                {isGeneratingDesc ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generează cu AI
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrie proprietatea în detaliu..."
              rows={6}
              required
            />
          </div>

          {/* Photos */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Fotografii {totalPhotos > 0 && <span className="text-sm font-normal text-muted-foreground">({totalPhotos})</span>}
            </h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Fotografii existente</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="group relative">
                      <img
                        src={img.url}
                        alt="Property"
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      {img.isPrimary && (
                        <div className="absolute left-1 top-1 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                          <Star className="h-3 w-3" /> Principală
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteImageTarget(img.id)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New file previews */}
            {newPreviewUrls.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Fotografii noi</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {newPreviewUrls.map((url, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={url}
                        alt={`New ${index + 1}`}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <div className="text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Adaugă fotografii noi
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Selectează fotografii
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/my-properties">Anulează</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Salvează modificările"
              )}
            </Button>
          </div>
        </form>
      </main>

      {/* Delete image confirmation */}
      <AlertDialog
        open={deleteImageTarget !== null}
        onOpenChange={(open) => !open && setDeleteImageTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge fotografia?</AlertDialogTitle>
            <AlertDialogDescription>
              Fotografia va fi ștearsă permanent și nu poate fi recuperată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExistingImage}
              disabled={isDeletingImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
