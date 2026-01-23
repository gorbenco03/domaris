"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PropertyWizard } from "@/components/PropertyWizard";
import { propertiesApi } from "@/features/properties/api";
import { IProperty } from "@domaris/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPropertyPage() {
  const { id } = useParams() as { id: string };
  const [property, setProperty] = useState<IProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
       try {
           const data = await propertiesApi.getDetail(id);
           setProperty(data);
       } catch (e) {
           console.error(e);
       } finally {
           setLoading(false);
       }
    };
    if(id) fetch();
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-20"><Skeleton className="h-[600px] w-full max-w-3xl mx-auto" /></div>;
  if (!property) return <div className="text-center py-20">Property not found</div>;

  // Map IProperty to WizardData
  const initialData = {
      transactionType: property.transactionType as 'SALE' | 'RENT',
      propertyType: property.propertyType,
      location: {
          city: property.location.city,
          neighborhood: property.location.neighborhood || '',
          street: property.location.street || '',
          number: property.location.streetNumber || ''
      },
      characteristics: {
          rooms: property.characteristics.rooms,
          bedrooms: property.characteristics.bedrooms || 0,
          bathrooms: property.characteristics.bathrooms,
          totalArea: property.characteristics.totalArea,
          floor: property.characteristics.floor || 0,
          totalFloors: property.characteristics.totalFloors || 0,
          yearBuilt: property.characteristics.yearBuilt || 2000,
          amenities: property.characteristics.amenities || []
      },
      pricing: {
          price: property.pricing.price,
          currency: property.pricing.currency as 'EUR' | 'RON', // Assuming overlap
          negotiable: property.pricing.isNegotiable
      },
      details: {
          title: property.title,
          description: property.description
      },
      existingPhotos: property.media.images.map(img => img.url)
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Property</h1>
      <PropertyWizard 
        isEditing 
        propertyId={id} 
        initialData={initialData as any} 
      />
    </div>
  );
}
