import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  priceRange: string;
  setPriceRange: (value: string) => void;
  bedrooms: string;
  setBedrooms: (value: string) => void;
  propertyType: string;
  setPropertyType: (value: string) => void;
}

export const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  priceRange,
  setPriceRange,
  bedrooms,
  setBedrooms,
  propertyType,
  setPropertyType,
}: SearchFiltersProps) => {
  return (
    <div className="bg-card border rounded-xl shadow-sm p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        
        {/* Location / Search */}
        <div className="md:col-span-4 space-y-1.5">
          <Label htmlFor="search" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Location or Keyword</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="City, neighborhood, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Categories / Type */}
        <div className="md:col-span-3 space-y-1.5">
           <Label htmlFor="type" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Property Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger id="type" className="bg-background">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
                <SelectItem value="VILLA">Villa</SelectItem>
                <SelectItem value="OFFICE">Office</SelectItem>
                <SelectItem value="LAND">Land</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {/* Price & Rooms Group */}
        <div className="md:col-span-3 grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
               <Label htmlFor="price" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Price</Label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger id="price" className="bg-background">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="0-300">€0 - €300</SelectItem>
                    <SelectItem value="300-500">€300 - €500</SelectItem>
                    <SelectItem value="500-1000">€500 - €1000</SelectItem>
                    <SelectItem value="1000+">€1000+</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-1.5">
                <Label htmlFor="rooms" className="text-xs font-semibold uppercase text-muted-foreground ml-1">Rooms</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger id="rooms" className="bg-background">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4+">4+</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </div>
        
        {/* Toggle / More */}
        <div className="md:col-span-2">
             <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-md" onClick={() => {}}>
                Search
             </Button>
        </div>
      </div>
    </div>
  );
};
