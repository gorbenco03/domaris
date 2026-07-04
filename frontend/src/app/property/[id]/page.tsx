"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  BedDouble,
  Maximize2,
  Building,
  Calendar as CalendarIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  BadgeCheck,
  Loader2,
  Star,
  ThumbsUp,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { getPropertyDetail, PropertyListing, searchProperties, trackPropertyView, getPropertyPrice, getPropertySurface, getPropertyMainImage, getPropertyLocation, getPropertyOwnerName, getPropertyOwnerAvatar } from "@/lib/propertiesApi";
import { getUserReviews, getUserReviewStats, toggleHelpful, Review, ReviewStats } from "@/lib/reviewsApi";
import { getListingValuation, AVMResponse } from "@/lib/aiApi";
import { checkIsFavorite, toggleFavorite } from "@/lib/favoritesApi";
import { requestViewing } from "@/lib/viewingsApi";
import { startConversation } from "@/lib/messagingApi";
import { useEarlyAccessCountdown } from "@/lib/earlyAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const timeSlots = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
];

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Property data state
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [relatedProperties, setRelatedProperties] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // AI Insights state
  const [valuation, setValuation] = useState<AVMResponse | null>(null);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Early access
  const earlyAccessLabel = useEarlyAccessCountdown(
    property?.listingStatus,
    property?.publicFrom
  );

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getPropertyDetail(propertyId);
        console.log('Property detail response:', data);
        setProperty(data);

        // Track view
        trackPropertyView(propertyId).catch(() => {});

        // Check favorite status
        if (isAuthenticated) {
          checkIsFavorite(data.id).then(status => {
            setIsFavorite(status.isFavorite);
          }).catch(() => {});
        }

        // Fetch owner reviews
        if (data.ownerId) {
          Promise.all([
            getUserReviews(String(data.ownerId)).catch(() => []),
            getUserReviewStats(String(data.ownerId)).catch(() => null),
          ]).then(([reviewsData, statsData]) => {
            setReviews(reviewsData);
            setReviewStats(statsData);
          });
        }

        // Fetch related properties
        if (data.city) {
          searchProperties({ city: data.city, limit: 3 })
            .then(related => {
              setRelatedProperties(related.data.filter(p => p.id !== data.id).slice(0, 3));
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setError("Nu am putut încărca proprietatea");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, isAuthenticated]);

  const propertyImages = property?.images?.map(img => img.url) || [];

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % Math.max(propertyImages.length, 1));
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + Math.max(propertyImages.length, 1)) % Math.max(propertyImages.length, 1));

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) setBookingStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setBookingStep(3);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !property) return;

    setIsBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const slot = new Date(selectedDate);
      slot.setHours(hours, minutes, 0, 0);

      await requestViewing({
        propertyId: property.id,
        slot: slot.toISOString(),
      });

      toast.success("Vizionare programată cu succes!", {
        description: `${format(selectedDate, "d MMMM yyyy", { locale: ro })} la ora ${selectedTime}`,
      });
      setSelectedDate(undefined);
      setSelectedTime(null);
      setBookingStep(1);
    } catch {
      toast.error("Nu am putut programa vizionarea. Încearcă din nou.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleBackStep = () => {
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedTime(null);
    } else if (bookingStep === 3) {
      setBookingStep(2);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !property) {
      toast.error("Trebuie să fii autentificat.");
      return;
    }
    try {
      await toggleFavorite(property.id, isFavorite);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? "Eliminat din favorite" : "Adăugat la favorite");
    } catch {
      toast.error("Eroare la actualizarea favoritelor.");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = property?.title || "Proprietate RIVA";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiat în clipboard!");
    }
  };

  // Lazy-load AI insights
  const handleToggleInsights = async () => {
    if (!isInsightsOpen && !valuation && property) {
      setIsLoadingInsights(true);
      try {
        const data = await getListingValuation(property.id);
        setValuation(data);
      } catch {
        // silently fail - UI handles null state
      } finally {
        setIsLoadingInsights(false);
      }
    }
    setIsInsightsOpen(!isInsightsOpen);
  };

  const handleSubmitReview = async () => {
    if (!property || reviewRating === 0 || !reviewComment.trim()) return;
    // Recenziile sunt legate de o vizionare finalizată (model anti-fraudă):
    // doar cine a vizionat efectiv proprietatea poate evalua proprietarul.
    // De aceea nu există o creare „liberă" de recenzie din pagina anunțului.
    toast.info("Poți lăsa o recenzie doar după o vizionare finalizată cu acest proprietar.");
    setShowReviewForm(false);
    setReviewRating(0);
    setReviewComment("");
  };

  const handleToggleHelpful = async (reviewId: string) => {
    try {
      const result = await toggleHelpful(reviewId);
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, helpfulCount: result.helpfulCount, isHelpful: result.isHelpful }
          : r
      ));
    } catch {
      // silently fail
    }
  };

  const pricePerSqm = property && getPropertySurface(property) > 0
    ? Math.round(getPropertyPrice(property) / getPropertySurface(property))
    : null;

  const handleStartConversation = async () => {
    if (!isAuthenticated) {
      toast.error("Trebuie să fii autentificat pentru a trimite mesaje.");
      router.push("/auth");
      return;
    }
    if (!property) return;
    setIsStartingConversation(true);
    try {
      const conversation = await startConversation({ propertyId: property.id });
      router.push(`/messages?chat=${conversation.id}`);
    } catch {
      toast.error("Nu am putut porni conversația. Încearcă din nou.");
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Loading state
  if (isLoading) {
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

  // Error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">{error || "Proprietatea nu a fost găsită"}</p>
          <Button asChild>
            <Link href="/search">Înapoi la căutare</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Image Gallery */}
        <div className="relative">
          <div className="relative h-[50vh] overflow-hidden bg-muted lg:h-[60vh]">
            {propertyImages[currentImage] && (
              <Image
                src={propertyImages[currentImage]}
                alt={property.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            )}

            {propertyImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {propertyImages.length > 1 && (
              <div className="absolute bottom-4 right-4 rounded-full bg-card/90 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                {currentImage + 1} / {propertyImages.length}
              </div>
            )}

            {/* Top Actions */}
            <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
              <Link
                href="/search"
                className="rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="rounded-full bg-card/90 p-3 text-foreground backdrop-blur-sm transition-all hover:bg-card"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={cn(
                    "rounded-full bg-card/90 p-3 backdrop-blur-sm transition-all hover:bg-card",
                    isFavorite ? "text-destructive" : "text-foreground"
                  )}
                >
                  <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </button>
              </div>
            </div>

            {/* Early Access Badge */}
            {earlyAccessLabel && (
              <div className="absolute left-4 bottom-4 rounded-full bg-orange-500 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {earlyAccessLabel}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {propertyImages.length > 1 && (
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 lg:px-8">
              {propertyImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImage(idx)}
                  className={cn(
                    "relative h-20 w-28 shrink-0 overflow-hidden rounded-lg transition-all",
                    currentImage === idx
                      ? "ring-2 ring-accent ring-offset-2"
                      : "opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt="" fill sizes="112px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Info */}
            <div className="lg:col-span-2">
              {/* Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                  {property.transactionType === "RENT" ? "De închiriat" : "De vânzare"}
                </span>
                <span className="rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                  {property.propertyType}
                </span>
                {earlyAccessLabel && (
                  <span className="rounded-md bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                    {earlyAccessLabel}
                  </span>
                )}
              </div>

              {/* Title & Location */}
              <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                {property.title}
              </h1>
              <div className="mb-6 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-accent" />
                <span>{property.address || getPropertyLocation(property)}</span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <p className="text-4xl font-bold text-primary">
                  {getPropertyPrice(property).toLocaleString()} €
                  {property.transactionType === "RENT" && <span className="text-lg font-normal text-muted-foreground">/lună</span>}
                </p>
                {pricePerSqm && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pricePerSqm.toLocaleString()} €/m²
                  </p>
                )}
              </div>

              {/* Specs Grid */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4">
                <div className="text-center">
                  <BedDouble className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">{property.rooms}</p>
                  <p className="text-sm uppercase text-muted-foreground">Camere</p>
                </div>
                <div className="text-center">
                  <Maximize2 className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">{getPropertySurface(property)} m²</p>
                  <p className="text-sm uppercase text-muted-foreground">Suprafață</p>
                </div>
                <div className="text-center">
                  <Building className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">
                    {property.floor !== undefined ? `${property.floor}/${property.totalFloors || "?"}` : "-"}
                  </p>
                  <p className="text-sm uppercase text-muted-foreground">Etaj</p>
                </div>
                <div className="text-center">
                  <CalendarIcon className="mx-auto mb-2 h-8 w-8 text-accent" />
                  <p className="text-2xl font-bold text-foreground">{property.yearBuilt || "-"}</p>
                  <p className="text-sm uppercase text-muted-foreground">An constr.</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">Descriere</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{property.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">Facilități</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.isFurnished && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>Mobilat</span>
                    </div>
                  )}
                  {property.hasCentralHeating && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>Centrală termică</span>
                    </div>
                  )}
                  {property.hasParking && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>Loc parcare</span>
                    </div>
                  )}
                  {property.hasBalcony && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>Balcon</span>
                    </div>
                  )}
                  {property.bathrooms && property.bathrooms > 0 && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Check className="h-5 w-5 text-accent" />
                      <span>{property.bathrooms} {property.bathrooms === 1 ? "Baie" : "Băi"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              <div className="mb-8">
                <Collapsible open={isInsightsOpen} onOpenChange={handleToggleInsights}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Estimare AI</p>
                          <p className="text-sm text-muted-foreground">Analiză automată de preț și piață</p>
                        </div>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isInsightsOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-2xl border border-border bg-card p-6">
                      {isLoadingInsights ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : valuation && !valuation.valuation.insufficientData && (valuation.valuation.recommendedPrice ?? -1) >= 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-muted p-4">
                              <p className="text-sm text-muted-foreground">Preț recomandat</p>
                              <p className="text-xl font-bold text-foreground">
                                {(valuation.valuation.recommendedPrice ?? 0).toLocaleString()} €
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted p-4">
                              <p className="text-sm text-muted-foreground">Interval</p>
                              <p className="text-lg font-semibold text-foreground">
                                {(valuation.valuation.priceRange.min ?? 0).toLocaleString()} - {(valuation.valuation.priceRange.max ?? 0).toLocaleString()} €
                              </p>
                            </div>
                            <div className="rounded-xl bg-muted p-4">
                              <p className="text-sm text-muted-foreground">Încredere</p>
                              <p className="text-xl font-bold text-foreground">
                                {Math.round(valuation.valuation.confidence * 100)}%
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-accent" />
                              <span className="text-muted-foreground">Lichiditate: {Math.round(valuation.valuation.liquidityScore)}%</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-accent" />
                              <span className="text-muted-foreground">Atractivitate: {Math.round(valuation.valuation.dealAttractivenessScore)}%</span>
                            </div>
                          </div>
                          {valuation.valuation.comparables.count > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Bazat pe {valuation.valuation.comparables.count} proprietăți comparabile
                              (medie {(valuation.valuation.comparables.avgPricePerSqm ?? 0).toLocaleString()} €/m²)
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Estimarea nu este disponibilă pentru această proprietate.</span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Location Map */}
              {property.lat && property.lng && (
                <div className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">Localizare</h2>
                  <div className="h-[300px] overflow-hidden rounded-2xl border border-border">
                    <PropertyMap
                      properties={[{
                        id: property.id,
                        title: property.title,
                        price: `${getPropertyPrice(property).toLocaleString()} €`,
                        location: getPropertyLocation(property),
                        lat: property.lat,
                        lng: property.lng,
                        image: propertyImages[0] || "",
                        rooms: property.rooms,
                        baths: property.bathrooms || 1,
                        area: getPropertySurface(property),
                        priceType: property.transactionType === "RENT" ? "rent" as const : "sale" as const,
                      }]}
                      onViewDetails={() => {}}
                    />
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Recenzii proprietar
                    {reviewStats && reviewStats.totalCount > 0 && (
                      <span className="ml-2 text-base font-normal text-muted-foreground">
                        ({reviewStats.totalCount})
                      </span>
                    )}
                  </h2>
                  {isAuthenticated && (
                    <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                      <Star className="mr-2 h-4 w-4" />
                      Scrie o recenzie
                    </Button>
                  )}
                </div>

                {/* Rating Summary */}
                {reviewStats && reviewStats.totalCount > 0 && (
                  <div className="mb-6 flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-foreground">{reviewStats.averageRating.toFixed(1)}</p>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={cn("h-4 w-4", s <= Math.round(reviewStats.averageRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{reviewStats.totalCount} recenzii</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {([5, 4, 3, 2, 1] as const).map(rating => {
                        const count = reviewStats.distribution[rating] || 0;
                        const pct = reviewStats.totalCount > 0 ? (count / reviewStats.totalCount) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2 text-sm">
                            <span className="w-3 text-muted-foreground">{rating}</span>
                            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review Cards */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map(review => (
                      <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.authorAvatar || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {review.authorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{review.authorName}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(review.createdAt), "d MMM yyyy", { locale: ro })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-foreground mb-3">{review.comment}</p>
                        {review.response && (
                          <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                            <p className="mb-1 font-medium text-foreground">Răspunsul proprietarului:</p>
                            <p className="text-muted-foreground">{review.response}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleToggleHelpful(review.id)}
                            className={cn(
                              "flex items-center gap-1 text-xs transition-colors",
                              review.isHelpful ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <ThumbsUp className={cn("h-3.5 w-3.5", review.isHelpful && "fill-current")} />
                            <span>Util ({review.helpfulCount})</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Încă nu există recenzii.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* OWNER VIEW — if this is the user's own property */}
                {isAuthenticated && user && String(property.ownerId) === String(user.id) ? (
                  <>
                    {/* Owner Dashboard Card */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Proprietatea ta</h3>
                      </div>

                      {/* Quick stats */}
                      <div className="mb-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-muted/50 p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{property.viewsCount ?? 0}</p>
                          <p className="text-xs text-muted-foreground">Vizualizări</p>
                        </div>
                        <div className="rounded-xl bg-muted/50 p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{property.leadsCount ?? 0}</p>
                          <p className="text-xs text-muted-foreground">Favorite</p>
                        </div>
                      </div>

                      {/* Owner actions */}
                      <div className="space-y-2">
                        <Button className="w-full" asChild>
                          <Link href={`/my-properties/${property.id}/analytics`}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Vezi statistici detaliate
                          </Link>
                        </Button>
                        {process.env.NEXT_PUBLIC_MONETIZATION_ENABLED === "true" && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/promote/${property.id}`}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Promovează anunțul
                          </Link>
                        </Button>
                        )}
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/edit-property/${property.id}`}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Editează anunțul
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/ai/listing-analysis/${property.id}`}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analiză AI
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Viewing requests for owner */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Cereri de vizionare</h3>
                      <p className="text-sm text-muted-foreground mb-3">Gestionează cererile primite pentru această proprietate.</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/viewings">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Vezi toate vizionările
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* VISITOR VIEW — Booking Card */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <h3 className="mb-6 text-lg font-semibold text-foreground">Programează vizionare</h3>

                      <div className="mb-6 flex gap-4 rounded-xl bg-muted p-4">
                        <div className="relative h-16 w-20 overflow-hidden rounded-lg bg-secondary">
                          {propertyImages[0] && (
                            <Image src={propertyImages[0]} alt="" fill sizes="80px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{property.title}</p>
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="mr-1 inline h-3 w-3" />
                            {property.city}
                          </p>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="mb-6 flex items-center justify-center gap-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                              bookingStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              {step === 1 && <CalendarIcon className="h-5 w-5" />}
                              {step === 2 && <Clock className="h-5 w-5" />}
                              {step === 3 && <Check className="h-5 w-5" />}
                            </div>
                            {step < 3 && <div className={cn("h-0.5 w-8 transition-colors", bookingStep > step ? "bg-primary" : "bg-muted")} />}
                          </div>
                        ))}
                      </div>
                      <div className="mb-6 flex justify-between text-xs text-muted-foreground">
                        <span>Data</span><span>Ora</span><span>Confirmare</span>
                      </div>

                      {bookingStep === 1 && (
                        <div className="space-y-4">
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <CalendarIcon className="h-4 w-4" /> Alege data vizionării
                          </p>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            className="rounded-xl border pointer-events-auto"
                            disabled={(date) => date < new Date()}
                          />
                        </div>
                      )}

                      {bookingStep === 2 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <Clock className="h-4 w-4" /> Alege ora vizionării
                            </p>
                            <button onClick={handleBackStep} className="text-sm text-primary hover:underline">Schimbă data</button>
                          </div>
                          {selectedDate && (
                            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: ro })}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={cn(
                                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                                  selectedTime === time
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card text-foreground hover:border-primary hover:bg-primary/10"
                                )}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {bookingStep === 3 && (
                        <div className="space-y-4">
                          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Check className="h-4 w-4" /> Confirmă vizionarea
                          </p>
                          <div className="space-y-2 rounded-xl bg-muted p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Data:</span>
                              <span className="font-medium text-foreground">
                                {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: ro })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Ora:</span>
                              <span className="font-medium text-foreground">{selectedTime}</span>
                            </div>
                          </div>
                          <Button
                            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                            size="lg"
                            onClick={handleConfirmBooking}
                            disabled={isBooking}
                          >
                            {isBooking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                            Confirmă vizionarea
                          </Button>
                          <button onClick={handleBackStep} className="w-full text-center text-sm text-primary hover:underline">
                            Înapoi la selectarea orei
                          </button>
                        </div>
                      )}

                      {bookingStep === 1 && selectedDate && (
                        <Button
                          className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                          size="lg"
                          onClick={() => setBookingStep(2)}
                        >
                          Continuă
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="lg"
                          className="flex-1"
                          onClick={handleStartConversation}
                          disabled={isStartingConversation}
                        >
                          {isStartingConversation ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : (
                            <MessageCircle className="mr-2 h-5 w-5" />
                          )}
                          Mesaj
                        </Button>
                      </div>
                    </div>

                    {/* Owner Card */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
                          {getPropertyOwnerAvatar(property) && (
                            <Image src={getPropertyOwnerAvatar(property)!} alt={getPropertyOwnerName(property)} fill sizes="56px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <Link href={`/user/${property.ownerId}`} className="flex items-center gap-2 hover:underline">
                            <span className="font-semibold text-foreground">{getPropertyOwnerName(property)}</span>
                            {/* Show verified badge only when owner is actually verified */}
                            {(property.owner as any)?.isVerified && (
                              <BadgeCheck className="h-4 w-4 text-primary" />
                            )}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {(property.owner as any)?.isVerified ? "Proprietar verificat" : "Proprietar"}
                          </p>
                        </div>
                      </div>
                      {/* Phone/Email buttons only when contact data is available */}
                      {((property.owner as any)?.phone || (property as any).ownerPhone ||
                        (property.owner as any)?.email || (property as any).ownerEmail) && (
                        <div className="mt-4 flex gap-2">
                          {((property.owner as any)?.phone || (property as any).ownerPhone) && (
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={`tel:${(property.owner as any)?.phone || (property as any).ownerPhone}`}>
                                <Phone className="mr-2 h-4 w-4" /> Sună
                              </a>
                            </Button>
                          )}
                          {((property.owner as any)?.email || (property as any).ownerEmail) && (
                            <Button variant="outline" size="sm" className="flex-1" asChild>
                              <a href={`mailto:${(property.owner as any)?.email || (property as any).ownerEmail}`}>
                                <Mail className="mr-2 h-4 w-4" /> Email
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
            <div className="mt-12 border-t border-border pt-12">
              <h2 className="mb-6 text-xl font-semibold text-foreground">Alte proprietăți similare</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProperties.map((rp) => (
                  <PropertyCard
                    key={rp.id}
                    id={rp.id}
                    image={getPropertyMainImage(rp)}
                    price={`${getPropertyPrice(rp).toLocaleString()} €`}
                    priceType={rp.transactionType === "RENT" ? "rent" : "sale"}
                    title={rp.title}
                    location={getPropertyLocation(rp)}
                    rooms={rp.rooms}
                    baths={rp.bathrooms || 1}
                    area={getPropertySurface(rp)}
                    isPromoted={rp.isPromoted}
                    tags={[]}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Review Form Dialog */}
      <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scrie o recenzie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)} className="p-1 transition-transform hover:scale-110">
                    <Star className={cn("h-8 w-8", s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Comentariu</label>
              <Textarea
                placeholder="Descrie experiența ta..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewForm(false)}>Anulează</Button>
            <Button
              onClick={handleSubmitReview}
              disabled={reviewRating === 0 || !reviewComment.trim()}
            >
              Trimite recenzia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
