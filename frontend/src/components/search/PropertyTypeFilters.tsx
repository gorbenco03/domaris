import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export type PropertyType = "apartments" | "houses" | "commercial" | "land";

interface FiltersPanelProps {
  propertyType: PropertyType;
  onReset?: () => void;
  onApply?: () => void;
}

// Common transaction filter
const TransactionFilter = () => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Tranzacție</label>
    <Select defaultValue="all">
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

// Common price filter
const PriceFilter = () => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Preț (€)</label>
    <div className="flex gap-2">
      <Input type="number" placeholder="Min" className="flex-1" />
      <Input type="number" placeholder="Max" className="flex-1" />
    </div>
  </div>
);

// Common area filter
const AreaFilter = ({ label = "Suprafață (m²)" }: { label?: string }) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
    <div className="flex gap-2">
      <Input type="number" placeholder="Min" className="flex-1" />
      <Input type="number" placeholder="Max" className="flex-1" />
    </div>
  </div>
);

// Rooms filter
const RoomsFilter = () => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Camere</label>
    <Select defaultValue="all">
      <SelectTrigger>
        <SelectValue placeholder="Număr camere" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Oricâte</SelectItem>
        <SelectItem value="1">1 cameră</SelectItem>
        <SelectItem value="2">2 camere</SelectItem>
        <SelectItem value="3">3 camere</SelectItem>
        <SelectItem value="4">4+ camere</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Baths filter
const BathsFilter = () => (
  <div>
    <label className="mb-2 block text-sm font-medium text-foreground">Băi</label>
    <Select defaultValue="all">
      <SelectTrigger>
        <SelectValue placeholder="Număr băi" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Oricâte</SelectItem>
        <SelectItem value="1">1 baie</SelectItem>
        <SelectItem value="2">2 băi</SelectItem>
        <SelectItem value="3">3+ băi</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Apartment-specific filters
const ApartmentFilters = () => (
  <>
    <TransactionFilter />
    <RoomsFilter />
    <BathsFilter />
    <PriceFilter />
    <AreaFilter />
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Etaj</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege etajul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Orice etaj</SelectItem>
          <SelectItem value="ground">Parter</SelectItem>
          <SelectItem value="1-3">Etaj 1-3</SelectItem>
          <SelectItem value="4-7">Etaj 4-7</SelectItem>
          <SelectItem value="8+">Etaj 8+</SelectItem>
          <SelectItem value="last">Ultimul etaj</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">An construcție</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege perioada" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Orice an</SelectItem>
          <SelectItem value="new">Construcție nouă (2020+)</SelectItem>
          <SelectItem value="2010-2020">2010-2020</SelectItem>
          <SelectItem value="2000-2010">2000-2010</SelectItem>
          <SelectItem value="1990-2000">1990-2000</SelectItem>
          <SelectItem value="before-1990">Înainte de 1990</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Compartimentare</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="decomandat">Decomandat</SelectItem>
          <SelectItem value="semidecomandat">Semidecomandat</SelectItem>
          <SelectItem value="nedecomandat">Nedecomandat</SelectItem>
          <SelectItem value="circular">Circular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

// House-specific filters
const HouseFilters = () => (
  <>
    <TransactionFilter />
    <RoomsFilter />
    <BathsFilter />
    <PriceFilter />
    <AreaFilter label="Suprafață utilă (m²)" />
    <AreaFilter label="Suprafață teren (m²)" />
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Tip casă</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="villa">Vilă</SelectItem>
          <SelectItem value="duplex">Duplex</SelectItem>
          <SelectItem value="triplex">Triplex</SelectItem>
          <SelectItem value="single">Casă individuală</SelectItem>
          <SelectItem value="row">Casă la curte</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Etaje</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Număr etaje" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricâte</SelectItem>
          <SelectItem value="1">Parter</SelectItem>
          <SelectItem value="2">P+1</SelectItem>
          <SelectItem value="3">P+2</SelectItem>
          <SelectItem value="4+">P+3 sau mai mult</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Garaj</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege opțiunea" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricare</SelectItem>
          <SelectItem value="yes">Cu garaj</SelectItem>
          <SelectItem value="no">Fără garaj</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Piscină</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege opțiunea" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricare</SelectItem>
          <SelectItem value="yes">Cu piscină</SelectItem>
          <SelectItem value="no">Fără piscină</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

// Commercial-specific filters
const CommercialFilters = () => (
  <>
    <TransactionFilter />
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Tip spațiu</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="office">Birou</SelectItem>
          <SelectItem value="retail">Spațiu comercial</SelectItem>
          <SelectItem value="warehouse">Depozit</SelectItem>
          <SelectItem value="industrial">Spațiu industrial</SelectItem>
          <SelectItem value="hotel">Hotel / Pensiune</SelectItem>
          <SelectItem value="restaurant">Restaurant / Bar</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <PriceFilter />
    <AreaFilter />
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Locuri parcare</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Număr locuri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricâte</SelectItem>
          <SelectItem value="0">Fără parcare</SelectItem>
          <SelectItem value="1-5">1-5 locuri</SelectItem>
          <SelectItem value="6-20">6-20 locuri</SelectItem>
          <SelectItem value="20+">20+ locuri</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Clasă clădire</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege clasa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="A">Clasa A</SelectItem>
          <SelectItem value="B">Clasa B</SelectItem>
          <SelectItem value="C">Clasa C</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Înălțime plafon</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege înălțimea" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricare</SelectItem>
          <SelectItem value="2.5-3">2.5-3m</SelectItem>
          <SelectItem value="3-4">3-4m</SelectItem>
          <SelectItem value="4-6">4-6m</SelectItem>
          <SelectItem value="6+">6m+</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

// Land-specific filters
const LandFilters = () => (
  <>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Tranzacție</label>
      <Select defaultValue="sale">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sale">De vânzare</SelectItem>
          <SelectItem value="rent">De închiriat</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Tip teren</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="intravilan">Intravilan</SelectItem>
          <SelectItem value="extravilan">Extravilan</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Clasificare</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege clasificarea" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate</SelectItem>
          <SelectItem value="construction">Construcții</SelectItem>
          <SelectItem value="agricultural">Agricol</SelectItem>
          <SelectItem value="forest">Pădure</SelectItem>
          <SelectItem value="industrial">Industrial</SelectItem>
          <SelectItem value="commercial">Comercial</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <PriceFilter />
    <AreaFilter label="Suprafață (m²)" />
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Front stradal (m)</label>
      <div className="flex gap-2">
        <Input type="number" placeholder="Min" className="flex-1" />
        <Input type="number" placeholder="Max" className="flex-1" />
      </div>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Utilități</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege opțiunea" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricare</SelectItem>
          <SelectItem value="all-utilities">Toate utilitățile</SelectItem>
          <SelectItem value="partial">Parțial</SelectItem>
          <SelectItem value="none">Fără utilități</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">Acces</label>
      <Select defaultValue="all">
        <SelectTrigger>
          <SelectValue placeholder="Alege tipul de acces" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Oricare</SelectItem>
          <SelectItem value="asphalt">Asfalt</SelectItem>
          <SelectItem value="paved">Drum pietruit</SelectItem>
          <SelectItem value="dirt">Drum de pământ</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

export const PropertyTypeFilters = ({ propertyType, onReset, onApply }: FiltersPanelProps) => {
  const renderFilters = () => {
    switch (propertyType) {
      case "apartments":
        return <ApartmentFilters />;
      case "houses":
        return <HouseFilters />;
      case "commercial":
        return <CommercialFilters />;
      case "land":
        return <LandFilters />;
      default:
        return <ApartmentFilters />;
    }
  };

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
          Aplică filtre
        </Button>
      </div>
    </div>
  );
};
