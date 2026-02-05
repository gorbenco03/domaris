import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  lat: number;
  lng: number;
  image: string;
  rooms: number;
  baths: number;
  area: number;
  priceType: "rent" | "sale";
}

interface PropertyMapProps {
  properties: Property[];
  onViewDetails?: (propertyId: number) => void;
}

export const PropertyMap = ({ properties, onViewDetails }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoicmFkdWM0IiwiYSI6ImNtamhjaGd0bzFiamozZXF4c2dxaWx6N3cifQ.91u_TJ3Zv2qkw8d5LW53vg";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [26.1025, 44.4268],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Wait for map to load before adding markers
    map.current.on('load', () => {
      addMarkers();
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, []);

  const addMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    properties.forEach((property) => {
      const el = document.createElement("div");
      el.className = "property-marker";
      el.style.cssText = "cursor: pointer; pointer-events: auto;";
      
      const markerContent = document.createElement("div");
      markerContent.style.cssText = `
        background: hsl(var(--primary));
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 13px;
        font-weight: 600;
        white-space: nowrap;
        transition: transform 0.2s;
        pointer-events: auto;
      `;
      markerContent.textContent = property.price;
      markerContent.onmouseover = () => { markerContent.style.transform = 'scale(1.1)'; };
      markerContent.onmouseout = () => { markerContent.style.transform = 'scale(1)'; };
      el.appendChild(markerContent);

      const popupContent = `
        <div id="popup-card-${property.id}" class="property-popup" style="width: 280px; padding: 0; margin: 0; cursor: pointer;">
          <div style="position: relative;">
            <img 
              src="${property.image}" 
              alt="${property.title}" 
              style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px 8px 0 0;"
            />
            <span style="
              position: absolute; 
              top: 8px; 
              left: 8px; 
              background: ${property.priceType === 'rent' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'};
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
            ">
              ${property.priceType === 'rent' ? 'De închiriat' : 'De vânzare'}
            </span>
          </div>
          <div style="padding: 12px;">
            <p style="font-weight: 700; font-size: 18px; color: hsl(var(--primary)); margin: 0 0 4px 0;">
              ${property.price}${property.priceType === 'rent' ? '/lună' : ''}
            </p>
            <p style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0; color: hsl(var(--foreground));">
              ${property.title}
            </p>
            <p style="font-size: 12px; color: hsl(var(--muted-foreground)); margin: 0 0 8px 0;">
              ${property.location}
            </p>
            <div style="display: flex; gap: 12px; font-size: 12px; color: hsl(var(--muted-foreground));">
              <span>${property.rooms} camere</span>
              <span>•</span>
              <span>${property.baths} băi</span>
              <span>•</span>
              <span>${property.area} m²</span>
            </div>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25, 
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
        className: "property-card-popup"
      }).setHTML(popupContent);

      popup.on('open', () => {
        // Close any other open popup
        if (activePopupRef.current && activePopupRef.current !== popup) {
          activePopupRef.current.remove();
        }
        activePopupRef.current = popup;

        // Add click handler for the entire card
        setTimeout(() => {
          const card = document.getElementById(`popup-card-${property.id}`);
          if (card) {
            card.addEventListener('click', () => {
              onViewDetails?.(property.id);
            });
          }
        }, 10);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([property.lng, property.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Use mousedown for more reliable click detection
      el.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });
      
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        marker.togglePopup();
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (properties.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((property) => {
        bounds.extend([property.lng, property.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  };

  // Re-add markers when properties change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkers();
    }
  }, [properties, onViewDetails]);

  return (
    <>
      <style>{`
        .property-card-popup .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
        }
        .property-card-popup .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px 12px;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          z-index: 10;
        }
        .property-card-popup .mapboxgl-popup-close-button:hover {
          background: transparent;
          color: white;
        }
      `}</style>
      <div ref={mapContainer} className="h-full w-full rounded-2xl overflow-hidden" />
    </>
  );
};
