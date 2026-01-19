"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bed, Bath, Maximize, MapPin, ArrowLeft, Heart, Share2, Expand, Calendar, MessageSquare } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import { TourRequestForm } from "@/components/TourRequestForm";
import PropertyMap from "@/components/PropertyMap";
import { useListing } from "@/hooks/useListing";
import { normalizeImageUrl } from "@/lib/api";

export default function PropertyDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { listing, loading, error } = useListing(id ? String(id) : '');
    const { isFavorite, toggleFavorite } = useFavorites();
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const favorited = listing ? isFavorite(listing.id) : false;

    // Get images from listing with normalized URLs
    const images = useMemo(() => {
        if (!listing) return [];
        if (listing.images.length === 0) return ['/placeholder.svg'];
        return listing.images
            .map(img => normalizeImageUrl(img.url))
            .filter(url => url !== '/placeholder.svg');
    }, [listing]);

    // Format location
    const location = useMemo(() => {
        if (!listing) return '';
        return listing.addressText || `${listing.neighborhood}, ${listing.city}`;
    }, [listing]);

    // Format price
    const price = useMemo(() => {
        if (!listing) return '';
        return `${listing.priceEur} ${listing.currency || 'EUR'}/mo`;
    }, [listing]);

    // Calculate bathrooms (approximation)
    const bathrooms = useMemo(() => {
        if (!listing) return 1;
        return Math.max(1, Math.floor(listing.rooms / 2));
    }, [listing]);

    // Amenities from listing data
    const amenities = useMemo(() => {
        if (!listing) return [];
        const amenityList: string[] = [];
        if (listing.isFurnished) amenityList.push('Furnished');
        if (listing.hasCentralHeating) amenityList.push('Central Heating');
        if (listing.isAgency) amenityList.push('Agency Managed');
        return amenityList;
    }, [listing]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const handleFavoriteClick = () => {
        if (!listing) return;

        const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0];
        const imageUrl = primaryImage?.url || '/placeholder.svg';

        toggleFavorite({
            id: listing.id,
            image: imageUrl,
            title: listing.title,
            location,
            price,
            bedrooms: listing.rooms,
            bathrooms,
            area: listing.surfaceSqm,
            type: 'Apartment',
        });
        toast.success(favorited ? "Removed from favorites" : "Added to favorites");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container py-8">
                    <Skeleton className="h-12 w-32 mb-6" />
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="h-[400px] w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                        <div className="lg:col-span-1">
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container py-16 text-center">
                    <Alert variant="destructive" className="max-w-md mx-auto mb-4">
                        <AlertDescription>
                            {error || "Property not found"}
                        </AlertDescription>
                    </Alert>
                    <Button onClick={() => router.push("/")}>Back to Home</Button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Properties
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                            {images.length > 0 && (
                                <>
                                    <div className="relative overflow-hidden rounded-lg group cursor-pointer" onClick={() => openLightbox(0)}>
                                        <img
                                            src={images[0]}
                                            alt={listing.title || 'Property image'}
                                            className="w-full h-[400px] object-cover transition-transform duration-300 group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                if (target.src !== '/placeholder.svg') {
                                                    target.src = '/placeholder.svg';
                                                }
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className="flex items-center gap-2 text-white">
                                                <Expand className="h-6 w-6" />
                                                <span className="font-semibold">View Full Size</span>
                                            </div>
                                        </div>
                                    </div>

                                    {images.length > 1 && (
                                        <div className="grid grid-cols-5 gap-2">
                                            {images.slice(1, 6).map((img, index) => (
                                                <div
                                                    key={index}
                                                    className="relative overflow-hidden rounded-md aspect-[4/3] cursor-pointer group"
                                                    onClick={() => openLightbox(index + 1)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`${listing.title || 'Property'} - Image ${index + 2}`}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                        referrerPolicy="no-referrer"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            if (target.src !== '/placeholder.svg') {
                                                                target.src = '/placeholder.svg';
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                        <Expand className="h-5 w-5 text-white" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex gap-2 mb-2">
                                        {listing.isAgency && (
                                            <Badge>Agency</Badge>
                                        )}
                                        {listing.isFurnished && (
                                            <Badge variant="secondary">Furnished</Badge>
                                        )}
                                        {listing.hasCentralHeating && (
                                            <Badge variant="outline">Central Heating</Badge>
                                        )}
                                    </div>
                                    <h1 className="text-3xl font-bold text-foreground mb-2">
                                        {listing.title}
                                    </h1>
                                    <p className="flex items-center text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {location}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="icon"
                                        variant={favorited ? "default" : "outline"}
                                        onClick={handleFavoriteClick}
                                    >
                                        <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                                    </Button>
                                    <Button size="icon" variant="outline">
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-6 py-4 border-y border-border">
                                <div className="flex items-center gap-2">
                                    <Bed className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-foreground font-medium">
                                        {listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bath className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-foreground font-medium">
                                        {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Maximize className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-foreground font-medium">
                                        {listing.surfaceSqm} m²
                                    </span>
                                </div>
                            </div>

                            <div className="py-6">
                                <h2 className="text-xl font-semibold text-foreground mb-3">
                                    About this property
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {listing.description}
                                </p>
                            </div>

                            {amenities.length > 0 && (
                                <div className="py-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-3">
                                        Amenities
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {amenities.map((amenity) => (
                                            <Badge key={amenity} variant="secondary">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {listing.lat && listing.lng && (
                                <div className="py-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-3">
                                        Location
                                    </h2>
                                    <PropertyMap
                                        properties={[
                                            {
                                                id: listing.id,
                                                title: listing.title,
                                                price: price,
                                                lat: listing.lat,
                                                lng: listing.lng,
                                            },
                                        ]}
                                        center={[listing.lat, listing.lng]}
                                        zoom={15}
                                        height="350px"
                                    />
                                </div>
                            )}

                            {listing.aiMetadata && (
                                <div className="py-6 border-t border-border">
                                    <h2 className="text-xl font-semibold text-foreground mb-3">
                                        Property Information
                                    </h2>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>
                                            <strong className="text-foreground">Source:</strong> {listing.sourceType || 'Unknown'}
                                        </p>
                                        <p>
                                            <strong className="text-foreground">Posted:</strong> {new Date(listing.postedAt).toLocaleDateString()}
                                        </p>
                                        {listing.aiMetadata.isAgency !== undefined && (
                                            <p>
                                                <strong className="text-foreground">Type:</strong> {listing.aiMetadata.isAgency ? 'Agency' : 'Private Owner'}
                                                {listing.aiMetadata.confidence && (
                                                    <span className="ml-2">({Math.round(listing.aiMetadata.confidence * 100)}% confidence)</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 p-6">
                            <div className="mb-6">
                                <p className="text-3xl font-bold text-primary mb-1">
                                    {price}
                                </p>
                                <p className="text-sm text-muted-foreground">per month</p>
                            </div>

                            <Tabs defaultValue="quick" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="quick" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Quick Contact
                                    </TabsTrigger>
                                    <TabsTrigger value="schedule" className="text-xs">
                                        <MessageSquare className="h-3 w-3 mr-1" />
                                        Schedule Tour
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="quick" className="space-y-3 mt-4">
                                    <Button className="w-full" size="lg">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Request a Tour
                                    </Button>
                                    <Button variant="outline" className="w-full" size="lg">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Contact Landlord
                                    </Button>
                                    <div className="pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Response time: Usually within 24 hours
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="schedule" className="mt-4">
                                    <TourRequestForm
                                        propertyTitle={listing.title}
                                        propertyId={String(listing.id)}
                                    />
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>

            {images.length > 0 && (
                <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                    <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
                        <Carousel className="w-full" opts={{ startIndex: lightboxIndex }}>
                            <CarouselContent>
                                {images.map((img, index) => (
                                    <CarouselItem key={index}>
                                        <div className="flex items-center justify-center min-h-[80vh] p-4">
                                            <img
                                                src={img}
                                                alt={`${listing.title || 'Property'} - Image ${index + 1}`}
                                                className="max-h-[80vh] w-auto object-contain"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    if (target.src !== '/placeholder.svg') {
                                                        target.src = '/placeholder.svg';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4" />
                            <CarouselNext className="right-4" />
                        </Carousel>
                    </DialogContent>
                </Dialog>
            )}

            <Footer />
        </div>
    );
}
