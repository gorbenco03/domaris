"use client";

import Link from "next/link";
import { MapPin, BedDouble, Maximize2, Home, CalendarPlus, MessageCircle } from "lucide-react";

export interface PropertyResult {
  id: number;
  image?: string;
  title: string;
  price: string;
  priceType: "sale" | "rent";
  location: string;
  rooms: number;
  area: number;
  score?: number;
  reasons?: string[];
}

interface AIChatPropertyCardProps {
  property: PropertyResult;
  onScheduleViewing?: (propertyId: number, propertyTitle: string) => void;
}

export const AIChatPropertyCard = ({ property, onScheduleViewing }: AIChatPropertyCardProps) => {
  return (
    <div className="group flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md">
      {/* Clickable image + info area */}
      <Link href={`/property/${property.id}`} className="flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {property.image ? (
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Home className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {property.score !== undefined && (
            <span className="absolute right-2 top-2 rounded-md bg-accent/90 px-2 py-0.5 text-xs font-bold text-accent-foreground backdrop-blur-sm">
              {property.score}/10
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-primary">{property.price}</span>
            {property.priceType === "rent" && (
              <span className="text-xs text-muted-foreground">/lună</span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground line-clamp-1">
            {property.title}
          </h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          {property.reasons && property.reasons.length > 0 && (
            <div className="line-clamp-2 text-[11px] text-accent">
              {property.reasons.join(" • ")}
            </div>
          )}
          <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BedDouble className="h-3 w-3" />
              {property.rooms}
            </span>
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3 w-3" />
              {property.area} m²
            </span>
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="flex gap-2 border-t border-border px-3 pb-3 pt-2">
        <button
          onClick={() => onScheduleViewing?.(property.id, property.title)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-[0.97]"
        >
          <CalendarPlus className="h-3 w-3 shrink-0" />
          Vizionare
        </button>
        <Link
          href={`/messages?propertyId=${property.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted px-2 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted/70 active:scale-[0.97]"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="h-3 w-3 shrink-0" />
          Contactează
        </Link>
      </div>
    </div>
  );
};
