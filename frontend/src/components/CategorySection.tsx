"use client";

import { Building2, Home, Store, Trees, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  bgClass: string;
  iconClass: string;
  href: string;
}

const CategoryCard = ({ icon, label, bgClass, iconClass, href }: CategoryCardProps) => (
  <Link
    href={href}
    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-accent hover:shadow-lg"
  >
    <div className={`rounded-xl p-4 ${bgClass}`}>
      <div className={iconClass}>{icon}</div>
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-foreground">{label}</h3>
      <p className="text-sm text-muted-foreground">Vezi anunțuri</p>
    </div>
    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
  </Link>
);

export const CategorySection = () => {
  const categories = [
    {
      icon: <Building2 className="h-6 w-6" />,
      label: "Apartamente",
      bgClass: "bg-category-apartments",
      iconClass: "text-category-apartments-icon",
      href: "/search?type=apartment",
    },
    {
      icon: <Home className="h-6 w-6" />,
      label: "Case & Vile",
      bgClass: "bg-category-houses",
      iconClass: "text-category-houses-icon",
      href: "/search?type=house",
    },
    {
      icon: <Store className="h-6 w-6" />,
      label: "Spații comerciale",
      bgClass: "bg-category-commercial",
      iconClass: "text-category-commercial-icon",
      href: "/search?type=commercial",
    },
    {
      icon: <Trees className="h-6 w-6" />,
      label: "Terenuri",
      bgClass: "bg-[hsl(120,40%,92%)]",
      iconClass: "text-[hsl(120,50%,40%)]",
      href: "/search?type=land",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground lg:text-3xl">
            Explorează după categorie
          </h2>
          <p className="mt-1 text-muted-foreground">
            Găsește proprietatea perfectă pentru nevoile tale
          </p>
        </div>
        <Link href="/search" className="hidden text-sm font-medium text-accent hover:underline sm:block">
          Vezi toate categoriile →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard key={category.label} {...category} />
        ))}
      </div>
    </section>
  );
};
