import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { PropertyGrid } from "@/components/PropertyGrid";
import { HowItWorks } from "@/components/HowItWorks";
import { Footer } from "@/components/Footer";

export default function Page() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Hero />
            <PropertyGrid />
            <HowItWorks />
            <Footer />
        </div>
    );
}
