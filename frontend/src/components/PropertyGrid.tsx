"use client";

import { useState, useEffect } from "react";
import { PropertyCard } from "./PropertyCard";
import { SearchFilters } from "./SearchFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { searchApi } from "@/features/search/api";
import { IPropertyListItem } from "@domaris/types";

export const PropertyGrid = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [bedrooms, setBedrooms] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  
  const [listings, setListings] = useState<IPropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProps = async () => {
        setLoading(true);
        try {
            const filters: any = {};
             // Price range filter
            if (priceRange !== "all") {
                if (priceRange === "0-2000") {
                    filters.maxPrice = 2000;
                } else if (priceRange === "2000-3000") {
                    filters.minPrice = 2000;
                    filters.maxPrice = 3000;
                } else if (priceRange === "3000-5000") {
                    filters.minPrice = 3000;
                    filters.maxPrice = 5000;
                } else if (priceRange === "5000+") {
                    filters.minPrice = 5000;
                }
            }
             // Bedrooms filter
            if (bedrooms !== "all") {
                if (bedrooms !== "4+") {
                    filters.rooms = parseInt(bedrooms);
                }
            }

            if(searchTerm) filters.location = searchTerm;

            const res = await searchApi.advancedSearch(filters);
            setListings(res.items);
        } catch {
            setError("Failed to load featured properties");
        } finally {
            setLoading(false);
        }
    };
    fetchProps();
  }, [searchTerm, priceRange, bedrooms, propertyType]);

  return (
    <section id="properties" className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Featured Properties
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our hand-picked selection of premium rental properties
          </p>
        </div>

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          propertyType={propertyType}
          setPropertyType={setPropertyType}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <PropertyCard key={listing.id} property={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No properties found matching your criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
