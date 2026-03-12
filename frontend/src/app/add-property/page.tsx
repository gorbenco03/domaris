"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Plus, ArrowLeft, Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty, uploadPropertyPhotos, CreatePropertyRequest } from "@/lib/propertiesApi";
import { toast } from "sonner";

export default function AddPropertyPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Files state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Create preview URLs
    const newPreviewUrls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();

    if (!title || !description || !propertyType || !priceEur || !city || !rooms || !surfaceSqm) {
      toast.error("Te rugăm să completezi toate câmpurile obligatorii");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreatePropertyRequest = {
        title,
        description,
        propertyType,
        transactionType,
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

      // Create property
      const property = await createProperty(data);

      // Upload photos if any
      if (selectedFiles.length > 0) {
        try {
          await uploadPropertyPhotos(property.id, selectedFiles);
        } catch (uploadError) {
          console.error("Photo upload error:", uploadError);
          toast.warning("Proprietatea a fost creată, dar au apărut erori la încărcarea fotografiilor");
        }
      }

      toast.success(asDraft ? "Ciorna a fost salvată" : "Anunțul a fost publicat cu succes!");
      router.push("/my-properties");
    } catch (err: any) {
      console.error("Failed to create property:", err);
      toast.error(err?.message || "Eroare la crearea anunțului");
    } finally {
      setIsSubmitting(false);
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
          <Link href="/my-properties" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi la proprietățile mele
          </Link>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Adaugă anunț</h1>
        <p className="mb-8 text-muted-foreground">Completează informațiile despre proprietatea ta</p>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
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
                <Select value={transactionType} onValueChange={(v) => setTransactionType(v as "RENT" | "SALE")}>
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
                  placeholder="ex: București"
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
                  placeholder="ex: Floreasca"
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

          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Descriere *</h2>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrie proprietatea în detaliu..."
              rows={6}
              required
            />
          </div>

          {/* Photos */}
          <div className="rounded-2xl border border-dashed border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Fotografii</h2>
            
            {previewUrls.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
                Adaugă fotografii pentru a atrage mai mulți vizitatori
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
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
            >
              Salvează ciornă
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se publică...
                </>
              ) : (
                "Publică anunțul"
              )}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
