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

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    // Default center: Chișinău, Moldova
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [28.8575, 47.0105],
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

      // Build popup DOM safely (no innerHTML/setHTML to avoid XSS)
      const popupNode = document.createElement("div");
      popupNode.style.cssText = "width:280px;padding:0;margin:0;cursor:pointer;";
      popupNode.dataset.popupId = String(property.id);

      const imgWrapper = document.createElement("div");
      imgWrapper.style.position = "relative";

      if (property.image) {
        const img = document.createElement("img");
        img.src = property.image;
        img.alt = "";
        img.style.cssText = "width:100%;height:160px;object-fit:cover;border-radius:8px 8px 0 0;";
        imgWrapper.appendChild(img);
      }

      const badge = document.createElement("span");
      badge.style.cssText = `
        position:absolute;top:8px;left:8px;
        background:${property.priceType === "rent" ? "hsl(var(--primary))" : "hsl(var(--accent))"};
        color:white;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;
      `;
      badge.textContent = property.priceType === "rent" ? "De închiriat" : "De vânzare";
      imgWrapper.appendChild(badge);
      popupNode.appendChild(imgWrapper);

      const info = document.createElement("div");
      info.style.padding = "12px";

      const priceEl = document.createElement("p");
      priceEl.style.cssText = "font-weight:700;font-size:18px;color:hsl(var(--primary));margin:0 0 4px 0;";
      priceEl.textContent = property.price + (property.priceType === "rent" ? "/lună" : "");
      info.appendChild(priceEl);

      const titleEl = document.createElement("p");
      titleEl.style.cssText = "font-weight:600;font-size:14px;margin:0 0 4px 0;color:hsl(var(--foreground));";
      titleEl.textContent = property.title;
      info.appendChild(titleEl);

      const locEl = document.createElement("p");
      locEl.style.cssText = "font-size:12px;color:hsl(var(--muted-foreground));margin:0 0 8px 0;";
      locEl.textContent = property.location;
      info.appendChild(locEl);

      const detailsEl = document.createElement("div");
      detailsEl.style.cssText = "display:flex;gap:12px;font-size:12px;color:hsl(var(--muted-foreground));";
      const rooms = document.createElement("span"); rooms.textContent = `${property.rooms} camere`;
      const sep1 = document.createElement("span"); sep1.textContent = "•";
      const baths = document.createElement("span"); baths.textContent = `${property.baths} băi`;
      const sep2 = document.createElement("span"); sep2.textContent = "•";
      const area = document.createElement("span"); area.textContent = `${property.area} m²`;
      detailsEl.append(rooms, sep1, baths, sep2, area);
      info.appendChild(detailsEl);
      popupNode.appendChild(info);

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: "300px",
        className: "property-card-popup",
      }).setDOMContent(popupNode);

      // Attach click handler directly to the DOM node (no querySelector needed)
      popupNode.addEventListener("click", () => {
        onViewDetails?.(property.id);
      });

      popup.on("open", () => {
        // Close any other open popup
        if (activePopupRef.current && activePopupRef.current !== popup) {
          activePopupRef.current.remove();
        }
        activePopupRef.current = popup;
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
