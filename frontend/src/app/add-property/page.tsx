"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Loader2,
  ImageIcon,
  Home,
  Building2,
  Store,
  Mountain,
  MapPin,
  Check,
  CheckCircle,
  ShieldCheck,
  BedDouble,
  Maximize2,
  Calendar,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createProperty, uploadPropertyPhotos, CreatePropertyRequest } from "@/lib/propertiesApi";
import { MAP_CONFIG } from "@/lib/constants";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================

interface PropertyFormData {
  // Step 1
  transactionType: "SALE" | "RENT" | null;
  propertyType: string | null;
  // Step 2
  city: string;
  neighborhood: string;
  address: string;
  county: string;
  lat: number | null;
  lng: number | null;
  // Step 3
  rooms: string;
  bathrooms: string;
  surfaceSqm: string;
  floor: string;
  totalFloors: string;
  yearBuilt: string;
  isFurnished: boolean;
  hasCentralHeating: boolean;
  hasParking: boolean;
  hasBalcony: boolean;
  hasElevator: boolean;
  // Step 4
  photos: File[];
  photoPreviewUrls: string[];
  // Step 5
  title: string;
  description: string;
  priceEur: string;
  currency: "EUR" | "RON";
  // Step 6
  ownershipDoc: File | null;
  ownershipDocType: string | null;
}

const INITIAL_FORM: PropertyFormData = {
  transactionType: null,
  propertyType: null,
  city: "",
  neighborhood: "",
  address: "",
  county: "",
  lat: null,
  lng: null,
  rooms: "",
  bathrooms: "",
  surfaceSqm: "",
  floor: "",
  totalFloors: "",
  yearBuilt: "",
  isFurnished: false,
  hasCentralHeating: false,
  hasParking: false,
  hasBalcony: false,
  hasElevator: false,
  photos: [],
  photoPreviewUrls: [],
  title: "",
  description: "",
  priceEur: "",
  currency: "EUR",
  ownershipDoc: null,
  ownershipDocType: null,
};

const STEP_TITLES = [
  "Tip proprietate",
  "Locație",
  "Caracteristici",
  "Fotografii",
  "Preț și descriere",
  "Verificare proprietate",
  "Previzualizare",
];

const PROPERTY_TYPES_LIST = [
  { value: "APARTMENT", label: "Apartament", icon: Building2 },
  { value: "HOUSE", label: "Casă", icon: Home },
  { value: "COMMERCIAL", label: "Spațiu comercial", icon: Store },
  { value: "LAND", label: "Teren", icon: Mountain },
];

const REGIONS = [
  "Chișinău", "Bălți", "Cahul", "Ungheni", "Orhei", "Soroca",
  "Edineț", "Comrat", "Strășeni", "Hîncești", "Ialoveni", "Criuleni",
  "Căușeni", "Florești", "Anenii Noi", "Telenești", "Sîngerei", "Rîșcani",
  "Briceni", "Ocnița", "Dondușeni", "Drochia", "Glodeni", "Fălești",
  "Nisporeni", "Călărași", "Rezina", "Șoldănești", "Dubăsari",
  "Ștefan Vodă", "Cimișlia", "Basarabeasca", "Leova", "Cantemir", "Taraclia",
];

const NEIGHBORHOODS: Record<string, string[]> = {
  "Chișinău": ["Centru", "Botanica", "Buiucani", "Ciocana", "Rîșcani"],
  "Bălți": ["Centru", "Dacia", "Slobozia", "Pământeni"],
};

const DOC_TYPE_LABELS: Record<string, string> = {
  PROPERTY_DEED: "Act de proprietate",
  UTILITY_BILL: "Factură utilități",
  RENTAL_CONTRACT: "Contract de închiriere",
  POWER_OF_ATTORNEY: "Procură",
  OTHER: "Alt document",
};

// ============================================
// MAP PICKER COMPONENT
// ============================================

function MapLocationPicker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || typeof window === "undefined") return;

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      // @ts-ignore - mapbox CSS import
      await import("mapbox-gl/dist/mapbox-gl.css");

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;
      mapboxgl.accessToken = token;

      const initialLat = lat || MAP_CONFIG.DEFAULT_LATITUDE;
      const initialLng = lng || MAP_CONFIG.DEFAULT_LONGITUDE;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [initialLng, initialLat],
        zoom: lat ? 15 : MAP_CONFIG.DEFAULT_ZOOM,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      const marker = new mapboxgl.Marker({ draggable: true, color: "#6366f1" })
        .setLngLat([initialLng, initialLat])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        onLocationChange(lngLat.lat, lngLat.lng);
      });

      map.on("click", (e: any) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        onLocationChange(e.lngLat.lat, e.lngLat.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      if (lat && lng) {
        onLocationChange(lat, lng);
      }
    };

    initMap();

    return () => {
      mapRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={mapContainerRef} className="h-[300px] w-full rounded-xl border border-border" />
      <p className="mt-2 text-xs text-muted-foreground">
        Apasă pe hartă sau trage marker-ul pentru a seta locația exactă
      </p>
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

function Step1PropertyType({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-2">Ce tip de tranzacție?</h2>
        <p className="text-sm text-muted-foreground mb-4">Selectează dacă vrei să vinzi sau să închiriezi</p>
        <div className="grid grid-cols-2 gap-4">
          {(["SALE", "RENT"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update({ transactionType: type })}
              className={cn(
                "rounded-xl border-2 p-6 text-center transition-all",
                form.transactionType === type
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <DollarSign className={cn("mx-auto h-8 w-8 mb-2", form.transactionType === type ? "text-primary" : "text-muted-foreground")} />
              <p className="font-semibold">{type === "SALE" ? "Vânzare" : "Închiriere"}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Ce tip de proprietate?</h2>
        <p className="text-sm text-muted-foreground mb-4">Alege categoria proprietății</p>
        <div className="grid grid-cols-2 gap-4">
          {PROPERTY_TYPES_LIST.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ propertyType: value })}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition-all",
                form.propertyType === value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className={cn("h-7 w-7 mb-2", form.propertyType === value ? "text-primary" : "text-muted-foreground")} />
              <p className="font-semibold">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Location({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  const neighborhoods = NEIGHBORHOODS[form.city] || [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Unde se află proprietatea?</h2>
        <p className="text-sm text-muted-foreground mb-4">Adaugă adresa completă pentru vizibilitate maximă</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Raion / Oraș *</Label>
          <Select value={form.city} onValueChange={(v) => update({ city: v, county: v, neighborhood: "" })}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selectează orașul" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {neighborhoods.length > 0 && (
          <div>
            <Label>Sector / Cartier</Label>
            <Select value={form.neighborhood} onValueChange={(v) => update({ neighborhood: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selectează sectorul" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="sm:col-span-2">
          <Label>Adresă (stradă, număr)</Label>
          <Input
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="ex: Strada Ștefan cel Mare 42"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Setează locația pe hartă *</Label>
        <MapLocationPicker
          lat={form.lat}
          lng={form.lng}
          onLocationChange={(lat, lng) => update({ lat, lng })}
        />
        {form.lat && form.lng && (
          <p className="mt-1 text-xs text-accent-foreground bg-accent/10 rounded-md px-3 py-1.5 inline-flex items-center gap-1">
            <Check className="h-3 w-3" /> Locație setată: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}

function Step3Characteristics({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Caracteristici</h2>
        <p className="text-sm text-muted-foreground mb-4">Completează detaliile proprietății</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Suprafață totală (m²) *</Label>
          <Input type="number" value={form.surfaceSqm} onChange={(e) => update({ surfaceSqm: e.target.value })} placeholder="ex: 75" className="mt-1" />
        </div>
        <div>
          <Label>Camere *</Label>
          <Input type="number" value={form.rooms} onChange={(e) => update({ rooms: e.target.value })} placeholder="ex: 3" className="mt-1" />
        </div>
        <div>
          <Label>Băi</Label>
          <Input type="number" value={form.bathrooms} onChange={(e) => update({ bathrooms: e.target.value })} placeholder="ex: 1" className="mt-1" />
        </div>
        <div>
          <Label>An construcție</Label>
          <Input type="number" value={form.yearBuilt} onChange={(e) => update({ yearBuilt: e.target.value })} placeholder="ex: 2015" className="mt-1" />
        </div>
        <div>
          <Label>Etaj</Label>
          <Input type="number" value={form.floor} onChange={(e) => update({ floor: e.target.value })} placeholder="ex: 3" className="mt-1" />
        </div>
        <div>
          <Label>Total etaje</Label>
          <Input type="number" value={form.totalFloors} onChange={(e) => update({ totalFloors: e.target.value })} placeholder="ex: 9" className="mt-1" />
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Facilități</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { key: "isFurnished" as const, label: "Mobilat" },
            { key: "hasCentralHeating" as const, label: "Centrală termică" },
            { key: "hasParking" as const, label: "Parcare" },
            { key: "hasBalcony" as const, label: "Balcon" },
            { key: "hasElevator" as const, label: "Ascensor" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox checked={form[key]} onCheckedChange={(c) => update({ [key]: !!c })} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4Photos({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));
    update({
      photos: [...form.photos, ...newFiles],
      photoPreviewUrls: [...form.photoPreviewUrls, ...newUrls],
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(form.photoPreviewUrls[index]);
    update({
      photos: form.photos.filter((_, i) => i !== index),
      photoPreviewUrls: form.photoPreviewUrls.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Fotografii</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Adaugă minim 3 fotografii pentru a crește vizibilitatea anunțului
        </p>
      </div>

      {form.photoPreviewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {form.photoPreviewUrls.map((url, index) => (
            <div key={index} className="relative group aspect-[4/3] rounded-xl overflow-hidden border border-border">
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Principală
                </span>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
      <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <ImageIcon className="h-12 w-12 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Trage fotografii aici sau apasă pentru a selecta</p>
        <p className="mt-1 text-xs text-muted-foreground">{form.photos.length}/20 fotografii adăugate</p>
      </div>
    </div>
  );
}

function Step5PricingDescription({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Preț și descriere</h2>
        <p className="text-sm text-muted-foreground mb-4">Setează prețul și adaugă o descriere detaliată</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Preț *</Label>
          <Input type="number" value={form.priceEur} onChange={(e) => update({ priceEur: e.target.value })} placeholder="ex: 85000" className="mt-1" />
        </div>
        <div>
          <Label>Monedă</Label>
          <Select value={form.currency} onValueChange={(v) => update({ currency: v as "EUR" | "RON" })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="RON">RON (lei)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Titlu anunț *</Label>
        <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="ex: Apartament 2 camere, Centru, renovat" className="mt-1" />
        <p className="mt-1 text-xs text-muted-foreground">{form.title.length}/100 caractere</p>
      </div>

      <div>
        <Label>Descriere *</Label>
        <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Descrie proprietatea în detaliu — stare, vecini, avantaje..." rows={6} className="mt-1" />
        <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/5000 caractere</p>
      </div>
    </div>
  );
}

function Step6OwnershipVerification({
  form,
  update,
}: {
  form: PropertyFormData;
  update: (u: Partial<PropertyFormData>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) update({ ownershipDoc: file });
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Verificare proprietate</h2>
          <p className="text-sm text-muted-foreground">Opțional — crește încrederea cumpărătorilor</p>
        </div>
      </div>

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-800 dark:text-amber-200">
        Încarcă un document care dovedește că ești proprietarul. Anunțul tău va primi un badge de
        <strong> „Proprietate verificată"</strong> după aprobarea echipei noastre.
        Fără document, anunțul va avea badge-ul <strong>„Neverificat"</strong>.
      </div>

      <div>
        <Label className="mb-2 block">Tip document</Label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ ownershipDocType: key })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                form.ownershipDocType === key
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Document</Label>
        {form.ownershipDoc ? (
          <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
            <CheckCircle className="h-5 w-5 text-accent-foreground shrink-0" />
            <span className="text-sm font-medium truncate flex-1">{form.ownershipDoc.name}</span>
            <button type="button" onClick={() => update({ ownershipDoc: null, ownershipDocType: null })}>
              <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ) : (
          <>
            <input type="file" ref={fileInputRef} onChange={handleDocSelect} accept=".pdf,image/*" className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 p-5 text-primary transition-colors hover:bg-primary/5"
            >
              <Upload className="h-5 w-5" />
              <span className="font-medium">Selectează document</span>
            </button>
          </>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Formate acceptate: PDF, JPG, PNG. Max 10 MB.</p>
      </div>
    </div>
  );
}

function Step7Preview({
  form,
  onEditStep,
}: {
  form: PropertyFormData;
  onEditStep: (step: number) => void;
}) {
  const typeLabel = PROPERTY_TYPES_LIST.find((t) => t.value === form.propertyType)?.label || form.propertyType;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Previzualizare</h2>
        <p className="text-sm text-muted-foreground mb-4">Verifică datele înainte de publicare</p>
      </div>

      {/* Preview card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {form.photoPreviewUrls.length > 0 && (
          <div className="relative h-48 bg-muted">
            <img src={form.photoPreviewUrls[0]} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {form.photos.length} foto
            </span>
          </div>
        )}
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {form.transactionType === "RENT" ? "De închiriat" : "De vânzare"}
            </span>
            <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">{typeLabel}</span>
            {!form.ownershipDoc && (
              <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">Neverificat</span>
            )}
            {form.ownershipDoc && (
              <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600">Verificare în curs</span>
            )}
          </div>
          <h3 className="text-lg font-bold">{form.title || "Fără titlu"}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {form.neighborhood ? `${form.neighborhood}, ` : ""}{form.city || "—"}
          </div>
          <p className="text-2xl font-bold text-primary">
            {form.priceEur ? Number(form.priceEur).toLocaleString() : "0"} {form.currency === "EUR" ? "€" : "lei"}
            {form.transactionType === "RENT" && <span className="text-sm font-normal text-muted-foreground">/lună</span>}
          </p>

          <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/50 p-4 text-center">
            <div>
              <BedDouble className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{form.rooms || "—"}</p>
              <p className="text-xs text-muted-foreground">Camere</p>
            </div>
            <div>
              <Maximize2 className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{form.surfaceSqm || "—"} m²</p>
              <p className="text-xs text-muted-foreground">Suprafață</p>
            </div>
            <div>
              <Calendar className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">{form.yearBuilt || "—"}</p>
              <p className="text-xs text-muted-foreground">An</p>
            </div>
          </div>

          {form.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{form.description}</p>
          )}

          {form.lat && form.lng && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Locație pe hartă setată
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEP_TITLES.slice(0, 6).map((title, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onEditStep(i + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            Editează: {title}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN WIZARD
// ============================================

export default function AddPropertyPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PropertyFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const totalSteps = 7;

  const update = useCallback((updates: Partial<PropertyFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!form.transactionType && !!form.propertyType;
      case 2: return !!form.city;
      case 3: return !!form.surfaceSqm;
      case 4: return form.photos.length >= 1;
      case 5: return !!form.priceEur && form.title.length >= 10;
      case 6: return !form.ownershipDoc || !!form.ownershipDocType;
      case 7: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data: CreatePropertyRequest = {
        title: form.title,
        description: form.description,
        propertyType: form.propertyType || "APARTMENT",
        transactionType: form.transactionType || "SALE",
        priceEur: parseFloat(form.priceEur),
        city: form.city,
        neighborhood: form.neighborhood || undefined,
        address: form.address || undefined,
        rooms: parseInt(form.rooms) || 1,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        surfaceSqm: parseFloat(form.surfaceSqm),
        floor: form.floor ? parseInt(form.floor) : undefined,
        totalFloors: form.totalFloors ? parseInt(form.totalFloors) : undefined,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
        isFurnished: form.isFurnished,
        hasCentralHeating: form.hasCentralHeating,
        hasParking: form.hasParking,
        hasBalcony: form.hasBalcony,
      };

      const property = await createProperty(data);

      if (form.photos.length > 0) {
        try {
          await uploadPropertyPhotos(property.id, form.photos);
        } catch {
          toast.warning("Proprietatea a fost creată, dar au apărut erori la încărcarea fotografiilor.");
        }
      }

      // TODO: Upload ownership doc when backend endpoint is ready
      // if (form.ownershipDoc && form.ownershipDocType) { ... }

      setIsSuccess(true);
      toast.success("Anunțul a fost publicat cu succes!");
    } catch (err: any) {
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
          <p className="mt-2 text-muted-foreground">Trebuie să fii autentificat pentru a adăuga o proprietate.</p>
          <Button asChild className="mt-6"><Link href="/auth">Autentifică-te</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Success screen
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle className="h-12 w-12 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Anunțul a fost publicat!</h1>
          <p className="mt-3 text-muted-foreground">
            {form.ownershipDoc
              ? "Anunțul tău este vizibil. Documentul de proprietate va fi verificat de echipa noastră."
              : "Anunțul tău este acum vizibil pentru toți utilizatorii."}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" asChild><Link href="/my-properties">Proprietățile mele</Link></Button>
            <Button onClick={() => { setForm(INITIAL_FORM); setStep(1); setIsSuccess(false); }}>
              <Plus className="mr-2 h-4 w-4" /> Adaugă alt anunț
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <button onClick={step > 1 ? handleBack : () => router.push("/my-properties")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {step > 1 ? "Înapoi" : "Anulează"}
          </button>
          <span className="text-sm text-muted-foreground">Pasul {step} din {totalSteps}</span>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>
        <h1 className="mb-6 text-sm font-medium text-primary">{STEP_TITLES[step - 1]}</h1>

        {/* Step content */}
        <div className="mb-8 min-h-[400px]">
          {step === 1 && <Step1PropertyType form={form} update={update} />}
          {step === 2 && <Step2Location form={form} update={update} />}
          {step === 3 && <Step3Characteristics form={form} update={update} />}
          {step === 4 && <Step4Photos form={form} update={update} />}
          {step === 5 && <Step5PricingDescription form={form} update={update} />}
          {step === 6 && <Step6OwnershipVerification form={form} update={update} />}
          {step === 7 && <Step7Preview form={form} onEditStep={setStep} />}
        </div>

        {/* Footer actions */}
        <div className="flex gap-4 border-t border-border pt-6">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" /> Înapoi
            </Button>
          )}
          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={!canProceed()} className={step > 1 ? "flex-[2]" : "w-full"}>
              Continuă <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()} className="flex-[2]">
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Se publică...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Publică anunțul</>
              )}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
