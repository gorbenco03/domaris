

"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchFilters } from "@/components/SearchFilters";
import { CategoriesBar } from "@/components/CategoriesBar";
import { PropertyCard } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { searchApi } from "@/features/search/api";
import { IPropertyListItem, IPropertySearchParams } from "@domaris/types";
import { Map, RefreshCw, Search } from "lucide-react";

export default function Page() {
    
    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [priceRange, setPriceRange] = useState("all");
    const [bedrooms, setBedrooms] = useState("all");
    const [propertyType, setPropertyType] = useState("all");
    
    // Data State
    const [listings, setListings] = useState<IPropertyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, _setViewMode] = useState<"list" | "map">("list");

    const fetchProperties = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters: Partial<IPropertySearchParams> = {};
            if (priceRange !== "all") {
                if (priceRange === "0-2000") filters.priceMax = 2000;
                else if (priceRange === "2000-3000") { filters.priceMin = 2000; filters.priceMax = 3000; }
                else if (priceRange === "3000-5000") { filters.priceMin = 3000; filters.priceMax = 5000; }
                else if (priceRange === "5000+") filters.priceMin = 5000;
            }
            if (bedrooms !== "all" && bedrooms !== "4+") filters.roomsMin = parseInt(bedrooms);
            if (searchTerm) filters.query = searchTerm; // Using generic query for flexibility
            if (propertyType !== "all") filters.propertyTypes = [propertyType as any]; // Casting as simple fix matching existing enum logic might need further alignment

            const res = await searchApi.advancedSearch(filters);
            setListings(res.items);
        } catch (err) {
            console.error(err);
            setError("Failed to load properties. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [searchTerm, priceRange, bedrooms, propertyType]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            
            <main className="flex-1">
                {/* Categories Bar */}
                <CategoriesBar 
                    selectedType={propertyType}
                    onSelect={setPropertyType}
                />

                <div className="container py-6">
                    {/* Hero / Search Section */}
                    <div className="mb-8">
                         <h2 className="text-2xl font-bold mb-4 tracking-tight">Find properties directly from owners</h2>
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
                    </div>

                    {/* Results Count & simple sort */}
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm font-medium text-muted-foreground">
                            {loading ? 'Searching...' : `${listings.length} verified listings`}
                        </p>
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 text-muted-foreground hover:text-foreground"
                            onClick={fetchProperties}
                        >
                            <RefreshCw className={loading ? "animate-spin" : ""} size={14} />
                            Refresh Results
                        </Button>
                    </div>

                    {/* Results Grid */}
                    {viewMode === 'list' ? (
                        <div className="space-y-6">
                             {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="space-y-4">
                                            <Skeleton className="h-[280px] w-full rounded-xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             ) : error ? (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                             ) : listings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {listings.map((listing) => (
                                        <PropertyCard key={listing.id} property={listing} />
                                    ))}
                                </div>
                             ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-card border-dashed">
                                    <div className="p-4 rounded-full bg-muted mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground opacity-50" /> 
                                    </div>
                                    <h3 className="text-lg font-medium">No properties found</h3>
                                    <p className="text-muted-foreground max-w-sm mt-2">
                                        We couldn't find any properties matching your filters. Try adjusting your search criteria.
                                    </p>
                                    <Button 
                                        variant="link" 
                                        onClick={() => {
                                            setSearchTerm("");
                                            setPriceRange("all");
                                            setBedrooms("all");
                                            setPropertyType("all");
                                        }}
                                        className="mt-4"
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                             )}
                        </div>
                    ) : (
                    <div className="h-[600px] w-full bg-muted/50 rounded-xl flex items-center justify-center border">
                        <div className="text-center">
                            <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="font-medium text-lg">Map View</h3>
                            <p className="text-muted-foreground">Map integration coming soon.</p>
                        </div>
                    </div>
                )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
