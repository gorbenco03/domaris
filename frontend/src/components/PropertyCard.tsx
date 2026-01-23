import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Bed, Maximize2, CheckCircle } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext"; // Assuming this context exists or will be updated
import { toast } from "sonner";
import type { IPropertyListItem } from "@domaris/types";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: IPropertyListItem;
  variant?: 'list' | 'compact';
}

export const PropertyCard = ({ property, variant = 'list' }: PropertyCardProps) => {
  // Favorites logic - mock for now if context is not fully ready for IPropertyListItem
  const { isFavorite, toggleFavorite } = useFavorites(); 
  const favorited = isFavorite(property.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite({
        id: property.id,
        image: property.mainImage || '/placeholder.svg',
        title: property.title,
        location: `${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}`,
        price: property.displayPrice,
        bedrooms: property.rooms, // Mapping rooms to bedrooms for compatibility if needed
        bathrooms: 0, // Not in list item
        area: property.totalArea,
        type: property.propertyType
    });
    toast.success(favorited ? "Removed from favorites" : "Added to favorites");
  };

  const isCompact = variant === 'compact';

  return (
    <Link href={`/property/${property.slug || property.id}`}>
        <Card className={cn(
            "overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col border-border/50",
            isCompact ? "w-[280px]" : "w-full"
        )}>
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                    src={property.mainImage || '/placeholder.svg'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {property.isPromoted && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm">Promoted</Badge>
                    )}
                    {property.isNew && (
                         <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm">New</Badge>
                    )}
                </div>

                {/* Favorite Button */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white text-muted-foreground hover:text-red-500 shadow-sm backdrop-blur-sm"
                    onClick={handleFavoriteClick}
                >
                    <Heart className={cn("h-5 w-5 transition-colors", favorited && "fill-red-500 text-red-500")} />
                </Button>

                {/* Price */}
                <div className="absolute bottom-3 left-3 text-white">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold">{property.displayPrice}</span>
                        {property.transactionType === 'RENT' && (
                             <span className="text-sm font-medium opacity-90">/mo</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {property.title}
                </h3>
                
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">
                        {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                    </span>
                </div>

                {/* Characteristics */}
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 mt-auto">
                    <div className="flex items-center gap-1.5" title="Rooms">
                        <Bed className="h-4 w-4" />
                        <span className="font-medium">{property.rooms}</span>
                    </div>
                    {/* Bathrooms not in IPropertyListItem, maybe add if API supports it later */}
                     <div className="flex items-center gap-1.5" title="Total Area">
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span className="font-medium">{property.totalArea} m²</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    {property.owner?.isVerified && (
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Verified Owner</span>
                        </div>
                    )}
                    
                    {/* Stats placeholder if needed, listing item doesn't usually have stats unless detailed */}
                     <div className="ml-auto" /> 
                </div>
            </CardContent>
        </Card>
    </Link>
  );
};
