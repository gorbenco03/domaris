"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { propertiesApi } from "@/features/properties/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2, MapPin, Bed, Bath, Maximize2, Calendar, ShieldCheck, Phone, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { IProperty } from "@domaris/types";
// import { useAuth } from "@/contexts/AuthContext";

export default function PropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params as { id: string };
  const [property, setProperty] = useState<IProperty | null>(null);
  const [loading, setLoading] = useState(true);
  // const { user } = useAuth();
  // Favorites logic hooks can be added here similar to PropertyCard

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await propertiesApi.getDetail(id);
        setProperty(data);
      } catch (error) {
        console.error("Failed to fetch property:", error);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
            <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
            </div>
        </div>
    );
  }

  if (!property) {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
            <Button onClick={() => router.push('/search')}>Back to Search</Button>
        </div>
    );
  }

  const { title, description, location, characteristics, pricing, media, owner } = property;
  const mainImage = media.images.find(img => img.isMain)?.url || media.images[0]?.url || '/placeholder.svg';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header/Nav - can be part of layout but good to have explicit back here */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" /> Back to Search
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 mb-8">
        <div className="relative aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden shadow-xl group">
            <img 
                src={mainImage} 
                alt={title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur">
                    <Heart className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full bg-white/90 backdrop-blur">
                    <Share2 className="h-5 w-5" />
                </Button>
            </div>
            {property.isPromoted && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white border-none py-1.5 px-3">Promoted</Badge>
            )}
        </div>
        
        {/* Gallery Thumbnails (Placeholder) */}
        {media.images.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                {media.images.slice(1, 5).map((img, idx) => (
                    <div key={img.id || idx} className="h-24 w-32 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                ))}
                {media.images.length > 5 && (
                    <Button variant="outline" className="h-24 w-32 flex-shrink-0 rounded-xl">
                        +{media.images.length - 5} photos
                    </Button>
                )}
            </div>
        )}
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                {/* Header Info */}
                <div>
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span className="text-lg">{location.fullAddress || `${location.city}, ${location.neighborhood}`}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                                {pricing.currency === 'EUR' ? '€' : pricing.currency} {pricing.price.toLocaleString()}
                                {property.transactionType === 'RENT' && <span className="text-lg text-muted-foreground font-normal">/month</span>}
                            </div>
                            {pricing.isNegotiable && <Badge variant="outline" className="mt-1">Negotiable</Badge>}
                        </div>
                     </div>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                        <Bed className="h-6 w-6 text-primary mb-2" />
                        <span className="font-semibold text-lg">{characteristics.rooms}</span>
                        <span className="text-sm text-muted-foreground">Rooms</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                        <Bath className="h-6 w-6 text-primary mb-2" />
                        <span className="font-semibold text-lg">{characteristics.bathrooms}</span>
                        <span className="text-sm text-muted-foreground">Baths</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                        <Maximize2 className="h-6 w-6 text-primary mb-2" />
                        <span className="font-semibold text-lg">{characteristics.totalArea} m²</span>
                        <span className="text-sm text-muted-foreground">Area</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 text-center">
                        <Calendar className="h-6 w-6 text-primary mb-2" />
                        <span className="font-semibold text-lg">{characteristics.yearBuilt || 'N/A'}</span>
                        <span className="text-sm text-muted-foreground">Year</span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Description</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{description}</p>
                </div>

                {/* Amenities */}
                {characteristics.amenities && characteristics.amenities.length > 0 && (
                     <div>
                        <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                        <div className="flex flex-wrap gap-2">
                            {characteristics.amenities.map((amenity, idx) => (
                                <Badge key={idx} variant="secondary" className="px-3 py-1.5 text-sm font-normal">
                                    {amenity}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar / Contact */}
            <div className="space-y-6">
                {/* Agent/Owner Card */}
                <div className="p-6 rounded-2xl border bg-card shadow-sm">
                    <h3 className="font-semibold text-lg mb-4">Contact Owner</h3>
                    <div className="flex items-center gap-4 mb-6">
                         <div className="h-14 w-14 rounded-full bg-slate-200 overflow-hidden">
                            {owner?.avatar ? (
                                <img src={owner.avatar} alt={owner.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                                    {owner?.firstName?.[0]}
                                </div>
                            )}
                         </div>
                         <div>
                            <div className="font-bold text-lg flex items-center gap-1">
                                {owner?.firstName} {owner?.lastName}
                                {owner?.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {(owner?.verificationLevel || 0) > 1 ? 'Verified User' : 'Member'}
                            </div>
                         </div>
                    </div>
                   
                   <div className="space-y-3">
                        <Button className="w-full h-12 text-base font-medium gap-2">
                             <Phone className="h-4 w-4" /> Show Phone Number
                        </Button>
                        <Button variant="outline" className="w-full h-12 text-base font-medium gap-2">
                             <Mail className="h-4 w-4" /> Send Message
                        </Button>
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
