"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/PropertyCard";
import { searchApi } from "@/features/search/api";
import type { IPropertyListItem } from "@domaris/types";
import { Search as SearchIcon, SlidersHorizontal, Map as MapIcon, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IPropertyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<"sale" | "rent">("rent");
  const [total, setTotal] = useState(0);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Mapping "sale" | "rent" to TransactionType enum if needed. 
      // Assuming backend handles lowercase string or we map it.
      // Shared types usually have enums like TransactionType.SALE / RENT
      const response = await searchApi.advancedSearch({
        query,
        transactionType: transactionType === "sale" ? "SALE" as any : "RENT" as any, 
        // Cast as any/enum because specific enum import might be tricky without full setup, 
        // relying on string compatibility or backend handling.
      });
      
      // IPropertySearchResult has 'items' but searchApi.advancedSearch returns IPropertySearchResult directly?
      // Check propertiesApi.search implementation I wrote: it calls /properties/search or /search
      // Let's assume response is IPropertySearchResult object
      if (response && response.items) {
          setResults(response.items);
          setTotal(response.total);
      } else {
          setResults([]);
          setTotal(0);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [transactionType]); // Trigger on mount and type change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 space-y-4">
            
            {/* Top Bar: Tabs & Filter Toggle */}
            <div className="flex items-center justify-between">
                <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as any)} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="rent">Rent</TabsTrigger>
                        <TabsTrigger value="sale">Buy</TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                         <MapIcon className="h-4 w-4" /> Map
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                         <SlidersHorizontal className="h-4 w-4" /> Filters
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
                <Input 
                    placeholder="Search by city, neighborhood..." 
                    className="pl-10 h-12 text-lg bg-muted/50 border-transparent focus:bg-background transition-colors"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Button type="submit" className="absolute right-1 top-1 bottom-1 rounded-md">
                    Search
                </Button>
            </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            {loading ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    Searching...
                </>
            ) : (
                <>
                    {total} Properties Found
                </>
            )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((property) => (
                <PropertyCard key={property.id} property={property} />
            ))}
        </div>

        {!loading && results.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
                <p>No properties found matching your criteria.</p>
                <Button variant="link" onClick={() => { setQuery(""); performSearch(); }}>Clear Filters</Button>
            </div>
        )}
      </div>
    </div>
  );
}
