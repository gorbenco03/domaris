"use client";

import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from "react-map-gl/mapbox";
import Link from "next/link";

// Use environment variable for token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbRxc...placeholder..."; // User needs to provide this

interface PropertyLocation {
  id: number;
  title: string;
  price: string | number;
  lat: number;
  lng: number;
  image?: string;
  type?: string;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function PropertyMap({
  properties,
  center = [44.4268, 26.1025], // Default to Bucharest
  zoom = 12,
  height = "400px"
}: PropertyMapProps) {
  const [popupInfo, setPopupInfo] = useState<PropertyLocation | null>(null);

  // Filter valid coordinates
  const validProperties = useMemo(() =>
    properties.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng)),
    [properties]);

  const markers = useMemo(() => validProperties.map((property) => (
    <Marker
      key={property.id}
      longitude={property.lng}
      latitude={property.lat}
      anchor="bottom"
      onClick={(e: any) => {
        // If we let the click propagate, we might close the popup
        e.originalEvent.stopPropagation();
        setPopupInfo(property);
      }}
    >
      <div className="cursor-pointer transition-transform hover:scale-110">
        <div className="flex items-center justify-center p-1 bg-white rounded-full shadow-md border border-gray-200">
          {/* Custom marker pin or price badge */}
          <div className="px-2 py-1 text-xs font-bold text-white bg-primary rounded-md whitespace-nowrap">
            {typeof property.price === 'number'
              ? `€${property.price.toLocaleString()}`
              : property.price}
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45"></div>
        </div>
      </div>
    </Marker>
  )), [validProperties]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      {(!MAPBOX_TOKEN || MAPBOX_TOKEN.includes("placeholder")) && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-destructive/10 border-b border-destructive p-2 text-xs text-destructive text-center font-medium">
          Mapbox Token missing. Please add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
        </div>
      )}

      <Map
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: zoom
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="bottom-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />

        {markers}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="min-w-[240px]"
          >
            <div className="p-0">
              <div className="font-semibold text-sm mb-1">{popupInfo.title}</div>
              <div className="text-primary font-bold mb-2">
                {typeof popupInfo.price === 'number'
                  ? `€${popupInfo.price.toLocaleString()}`
                  : popupInfo.price}
              </div>
              <Link
                href={`/property/${popupInfo.id}`}
                className="block w-full text-center bg-primary text-primary-foreground text-xs py-1.5 rounded-md hover:bg-primary/90 transition-colors"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
