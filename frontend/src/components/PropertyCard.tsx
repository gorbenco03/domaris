import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";
import { type Listing, normalizeImageUrl } from "@/lib/api";

interface PropertyCardProps {
  listing: Listing;
}

export const PropertyCard = ({ listing }: PropertyCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(listing.id);

  // Get primary image or first image
  const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0];
  // Normalize image URL (handles both absolute and relative URLs)
  const imageUrl = normalizeImageUrl(primaryImage?.url);

  // Format location
  const location = listing.addressText || `${listing.neighborhood}, ${listing.city}`;

  // Format price
  const price = `${listing.priceEur} ${listing.currency || 'EUR'}/mo`;

  // Calculate bathrooms (assuming 1 bathroom per room or use rooms as approximation)
  const bathrooms = Math.max(1, Math.floor(listing.rooms / 2));

  // Convert surface from sqm to sqft (approximate)
  const areaSqft = Math.round(listing.surfaceSqm * 10.764);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite({
      id: listing.id,
      image: imageUrl,
      title: listing.title,
      location,
      price,
      bedrooms: listing.rooms,
      bathrooms,
      area: areaSqft,
      type: 'Apartment' // Default type, can be enhanced later
    });
    toast.success(favorited ? "Removed from favorites" : "Added to favorites");
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={imageUrl}
          alt={listing.title || 'Property image'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/placeholder.svg') {
              target.src = '/placeholder.svg';
            }
          }}
        />
        {listing.isAgency && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
            Agency
          </Badge>
        )}
        {listing.isFurnished && (
          <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground" style={{ top: listing.isAgency ? '3.5rem' : '1rem' }}>
            Furnished
          </Badge>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 right-4 h-9 w-9"
          onClick={handleFavoriteClick}
        >
          <Heart className={`h-5 w-5 ${favorited ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-1">
            {listing.title}
          </h3>
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {price}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{location}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span>{listing.surfaceSqm} m²</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <Link href={`/property/${listing.id}`} className="w-full">
          <Button className="w-full" variant="outline">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
