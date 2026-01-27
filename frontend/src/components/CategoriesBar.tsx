"use client";

import { cn } from "@/lib/utils";
import { 
  Building2, 
  Home, 
  Armchair, 
  Hotel,
  Warehouse,
} from "lucide-react";

interface CategoriesBarProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Home },
  { id: "Apartment", label: "Apartments", icon: Building2 },
  { id: "House", label: "Houses", icon: Home },
  { id: "Studio", label: "Studios", icon: Armchair },
  { id: "Penthouse", label: "Penthouse", icon: Hotel },
  { id: "Loft", label: "Lofts", icon: Warehouse },
  // Add more as needed matching PropertyType enum
];

export const CategoriesBar = ({ selectedType, onSelect }: CategoriesBarProps) => {
  return (
    <div className="w-full border-b bg-background sticky top-16 z-30 pt-4 pb-2">
      <div className="container overflow-x-auto no-scrollbar">
        <div className="flex gap-8 min-w-max pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;
            
            return (
              <button
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 group min-w-[64px] transition-all cursor-pointer outline-none",
                  isSelected 
                    ? "text-primary border-b-2 border-primary pb-2" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg pb-2 border-b-2 border-transparent hover:border-muted-foreground/20"
                )}
              >
                <Icon 
                  strokeWidth={isSelected ? 2.5 : 2}
                  className={cn(
                    "h-6 w-6 transition-transform group-hover:scale-110",
                    isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
