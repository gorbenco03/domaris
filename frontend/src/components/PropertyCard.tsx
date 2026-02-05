"use client";

import { Heart, MapPin, BedDouble, Bath, Maximize2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  id?: number;
  image: string;
  price: string;
  priceType?: "sale" | "rent";
  title: string;
  location: string;
  rooms: number;
  baths: number;
  area: number;
  floor?: string;
  isFavorite?: boolean;
  tags?: string[];
}

export const PropertyCard = ({
  id = 1,
  image,
  price,
  priceType = "sale",
  title,
  location,
  rooms,
  baths,
  area,
  floor,
  isFavorite = false,
  tags = [],
}: PropertyCardProps) => {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg">
      {/* Image */}
      <Link href={`/property/${id}`} className="relative block aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "absolute right-3 top-3 rounded-full bg-card/90 p-2.5 backdrop-blur-sm transition-all hover:scale-110",
            isFavorite ? "text-destructive" : "text-muted-foreground hover:text-destructive"
          )}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="absolute left-3 top-3 flex gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Content */}
      <Link href={`/property/${id}`} className="block p-5">
        {/* Price */}
        <div className="mb-2">
          <span className="text-2xl font-bold text-primary">{price}</span>
          {priceType === "rent" && (
            <span className="text-base text-muted-foreground"> /lună</span>
          )}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {title}
        </h3>
        
        <div className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Details */}
        <div className="flex items-center gap-5 border-t border-border pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" />
            <span>{rooms} camere</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            <span>{baths} băi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4" />
            <span>{area} m²</span>
          </div>
        </div>
      </Link>
    </article>
  );
};
