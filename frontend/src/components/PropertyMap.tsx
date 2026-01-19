import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: (markerIcon as any).src || markerIcon,
  shadowUrl: (markerShadow as any).src || markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface PropertyLocation {
  id: number;
  title: string;
  price: string;
  lat: number;
  lng: number;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const PropertyMap = ({
  properties,
  center = [40.7128, -74.0060],
  zoom = 13,
  height = "400px"
}: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add markers
    properties.forEach((property) => {
      const marker = L.marker([property.lat, property.lng], { icon: defaultIcon }).addTo(map);
      marker.bindPopup(`
        <div style="text-align: left;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${property.title}</h3>
          <p style="color: #8b5cf6; font-weight: 500;">${property.price}</p>
        </div>
      `);
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [properties, center, zoom]);

  return <div ref={mapRef} style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }} />;
};

export default PropertyMap;
