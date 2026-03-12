import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { X, ChevronDown } from "lucide-react";
import { useState } from "react";

export type PropertyType = "apartments" | "houses" | "commercial" | "land";

// Filter state that maps to PropertySearchParams
export interface SearchFilters {
  transactionType?: string;
  minPrice?: string;
  maxPrice?: string;
  minRooms?: string;
  maxRooms?: string;
  minBathrooms?: string;
  maxBathrooms?: string;
  minSurface?: string;
  maxSurface?: string;
  minFloor?: string;
  maxFloor?: string;
  minYear?: string;
  maxYear?: string;
  city?: string;
  neighborhood?: string;
  isFurnished?: boolean;
  hasCentralHeating?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  hasAC?: boolean;
  hasStorage?: boolean;
  hasGarden?: boolean;
}

export const emptyFilters: SearchFilters = {};

interface FiltersPanelProps {
  propertyType: PropertyType;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset?: () => void;
  onApply?: () => void;
}

// Helper to update a single filter field
function useFilterUpdater(filters: SearchFilters, onChange: (f: SearchFilters) => void) {
  return (key: keyof SearchFilters, value: unknown) => {
    const next = { ...filters };
    if (value === undefined || value === "" || value === "all" || value === false) {
      delete next[key];
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (next as any)[key] = value;
    }
    onChange(next);
  };
}

// ─── Shared filter sub-components ─────────────────────────────────────────

const TransactionFilter = ({ value, onUpdate }: { value?: string; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Tranzacție</label>
    <Select value={value || "all"} onValueChange={(v) => onUpdate("transactionType", v)}>
      <SelectTrigger>
        <SelectValue placeholder="Alege tipul" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toate</SelectItem>
        <SelectItem value="sale">De vânzare</SelectItem>
        <SelectItem value="rent">De închiriat</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const PriceFilter = ({ minValue, maxValue, onUpdate }: { minValue?: string; maxValue?: string; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Preț (€)</label>
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="Min"
        className="flex-1"
        value={minValue || ""}
        onChange={(e) => onUpdate("minPrice", e.target.value)}
      />
      <Input
        type="number"
        placeholder="Max"
        className="flex-1"
        value={maxValue || ""}
        onChange={(e) => onUpdate("maxPrice", e.target.value)}
      />
    </div>
  </div>
);

const AreaFilter = ({ label = "Suprafață (m²)", minValue, maxValue, onUpdate }: { label?: string; minValue?: string; maxValue?: string; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
    <div className="flex gap-2">
      <Input
        type="number"
        placeholder="Min"
        className="flex-1"
        value={minValue || ""}
        onChange={(e) => onUpdate("minSurface", e.target.value)}
      />
      <Input
        type="number"
        placeholder="Max"
        className="flex-1"
        value={maxValue || ""}
        onChange={(e) => onUpdate("maxSurface", e.target.value)}
      />
    </div>
  </div>
);

const RoomsFilter = ({ value, onUpdate }: { value?: string; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Camere</label>
    <Select value={value || "all"} onValueChange={(v) => {
      if (v === "all") {
        onUpdate("minRooms", undefined);
        onUpdate("maxRooms", undefined);
      } else if (v === "4+") {
        onUpdate("minRooms", "4");
        onUpdate("maxRooms", undefined);
      } else {
        onUpdate("minRooms", v);
        onUpdate("maxRooms", v);
      }
    }}>
      <SelectTrigger>
        <SelectValue placeholder="Număr camere" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Oricâte</SelectItem>
        <SelectItem value="1">1 cameră</SelectItem>
        <SelectItem value="2">2 camere</SelectItem>
        <SelectItem value="3">3 camere</SelectItem>
        <SelectItem value="4+">4+ camere</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const BathsFilter = ({ value, onUpdate }: { value?: string; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Băi</label>
    <Select value={value || "all"} onValueChange={(v) => {
      if (v === "all") {
        onUpdate("minBathrooms", undefined);
        onUpdate("maxBathrooms", undefined);
      } else if (v === "3+") {
        onUpdate("minBathrooms", "3");
        onUpdate("maxBathrooms", undefined);
      } else {
        onUpdate("minBathrooms", v);
        onUpdate("maxBathrooms", v);
      }
    }}>
      <SelectTrigger>
        <SelectValue placeholder="Număr băi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Oricâte</SelectItem>
        <SelectItem value="1">1 baie</SelectItem>
        <SelectItem value="2">2 băi</SelectItem>
        <SelectItem value="3+">3+ băi</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Derive the current rooms select value from filter state
function getRoomsSelectValue(filters: SearchFilters): string {
  if (!filters.minRooms) return "all";
  if (filters.minRooms === "4" && !filters.maxRooms) return "4+";
  return filters.minRooms;
}

function getBathsSelectValue(filters: SearchFilters): string {
  if (!filters.minBathrooms) return "all";
  if (filters.minBathrooms === "3" && !filters.maxBathrooms) return "3+";
  return filters.minBathrooms;
}

// ─── Amenities section ──────────────────────────────────────────────────

const amenityOptions: { key: keyof SearchFilters; label: string }[] = [
  { key: "isFurnished", label: "Mobilat" },
  { key: "hasCentralHeating", label: "Centrală termică" },
  { key: "hasParking", label: "Parcare" },
  { key: "hasBalcony", label: "Balcon" },
  { key: "hasElevator", label: "Lift" },
  { key: "hasAC", label: "Aer condiționat" },
  { key: "hasStorage", label: "Debara / Boxă" },
  { key: "hasGarden", label: "Grădină" },
];

const AmenitiesFilter = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <div>
    <label className="mb-3 block text-sm font-medium text-foreground">Dotări</label>
    <div className="grid grid-cols-2 gap-3">
      {amenityOptions.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={!!filters[key]}
            onCheckedChange={(checked) => onUpdate(key, checked ? true : undefined)}
          />
          <span className="text-foreground">{label}</span>
        </label>
      ))}
    </div>
  </div>
);

// ─── Floor & Year filters (collapsible "More") ──────────────────────────

const MoreFilters = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => {
  const [open, setOpen] = useState(false);

  const hasMoreFilters = filters.minFloor || filters.maxFloor || filters.minYear || filters.maxYear;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between text-sm font-medium text-foreground py-1">
          <span>Mai multe filtre {hasMoreFilters ? "•" : ""}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 pt-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Etaj</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              className="flex-1"
              value={filters.minFloor || ""}
              onChange={(e) => onUpdate("minFloor", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              className="flex-1"
              value={filters.maxFloor || ""}
              onChange={(e) => onUpdate("maxFloor", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">An construcție</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              className="flex-1"
              value={filters.minYear || ""}
              onChange={(e) => onUpdate("minYear", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max"
              className="flex-1"
              value={filters.maxYear || ""}
              onChange={(e) => onUpdate("maxYear", e.target.value)}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ─── Property type specific filter sets ─────────────────────────────────

const ApartmentFilters = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <>
    <TransactionFilter value={filters.transactionType} onUpdate={onUpdate} />
    <RoomsFilter value={getRoomsSelectValue(filters)} onUpdate={onUpdate} />
    <BathsFilter value={getBathsSelectValue(filters)} onUpdate={onUpdate} />
    <PriceFilter minValue={filters.minPrice} maxValue={filters.maxPrice} onUpdate={onUpdate} />
    <AreaFilter minValue={filters.minSurface} maxValue={filters.maxSurface} onUpdate={onUpdate} />
    <AmenitiesFilter filters={filters} onUpdate={onUpdate} />
    <MoreFilters filters={filters} onUpdate={onUpdate} />
  </>
);

const HouseFilters = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <>
    <TransactionFilter value={filters.transactionType} onUpdate={onUpdate} />
    <RoomsFilter value={getRoomsSelectValue(filters)} onUpdate={onUpdate} />
    <BathsFilter value={getBathsSelectValue(filters)} onUpdate={onUpdate} />
    <PriceFilter minValue={filters.minPrice} maxValue={filters.maxPrice} onUpdate={onUpdate} />
    <AreaFilter label="Suprafață utilă (m²)" minValue={filters.minSurface} maxValue={filters.maxSurface} onUpdate={onUpdate} />
    <AmenitiesFilter filters={filters} onUpdate={onUpdate} />
    <MoreFilters filters={filters} onUpdate={onUpdate} />
  </>
);

const CommercialFilters = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <>
    <TransactionFilter value={filters.transactionType} onUpdate={onUpdate} />
    <PriceFilter minValue={filters.minPrice} maxValue={filters.maxPrice} onUpdate={onUpdate} />
    <AreaFilter minValue={filters.minSurface} maxValue={filters.maxSurface} onUpdate={onUpdate} />
    <AmenitiesFilter filters={filters} onUpdate={onUpdate} />
  </>
);

const LandFilters = ({ filters, onUpdate }: { filters: SearchFilters; onUpdate: (key: keyof SearchFilters, v: unknown) => void }) => (
  <>
    <TransactionFilter value={filters.transactionType} onUpdate={onUpdate} />
    <PriceFilter minValue={filters.minPrice} maxValue={filters.maxPrice} onUpdate={onUpdate} />
    <AreaFilter label="Suprafață (m²)" minValue={filters.minSurface} maxValue={filters.maxSurface} onUpdate={onUpdate} />
  </>
);

// ─── Main component ─────────────────────────────────────────────────────

export const PropertyTypeFilters = ({ propertyType, filters, onChange, onReset, onApply }: FiltersPanelProps) => {
  const onUpdate = useFilterUpdater(filters, onChange);

  const renderFilters = () => {
    switch (propertyType) {
      case "apartments":
        return <ApartmentFilters filters={filters} onUpdate={onUpdate} />;
      case "houses":
        return <HouseFilters filters={filters} onUpdate={onUpdate} />;
      case "commercial":
        return <CommercialFilters filters={filters} onUpdate={onUpdate} />;
      case "land":
        return <LandFilters filters={filters} onUpdate={onUpdate} />;
      default:
        return <ApartmentFilters filters={filters} onUpdate={onUpdate} />;
    }
  };

  const activeCount = Object.keys(filters).length;

  return (
    <div className="space-y-5">
      {renderFilters()}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onReset}>
          <X className="mr-2 h-4 w-4" />
          Resetează
        </Button>
        <Button
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={onApply}
        >
          Aplică{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>
    </div>
  );
};
