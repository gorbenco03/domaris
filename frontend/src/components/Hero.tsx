import { Button } from "@/components/ui/button";
import { Search, Building2 } from "lucide-react";
import heroImage from "@/assets/hero-apartment.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage.src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect Home or Tenant
          </h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Connect landlords with tenants seamlessly. Browse hundreds of properties or list yours today.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2 text-base shadow-lg hover:shadow-xl transition-all">
              <Search className="h-5 w-5" />
              Find a Property
            </Button>
            <Button size="lg" variant="secondary" className="gap-2 text-base shadow-lg hover:shadow-xl transition-all">
              <Building2 className="h-5 w-5" />
              List Your Property
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
