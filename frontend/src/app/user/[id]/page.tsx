"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Star, 
  Calendar, 
  CheckCircle, 
  Home,
  MapPin,
  User as UserIcon,
  MessageCircle,
  Shield
} from "lucide-react";
import { getPublicProfile, getUserListings, PublicUserProfile, UserListing } from "@/lib/userApi";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";


export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  
  // API state
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [profileData, listingsData] = await Promise.all([
          getPublicProfile(userId),
          getUserListings(userId),
        ]);
        
        setProfile(profileData);
        setListings(listingsData);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Nu am putut încărca profilul");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  const getFullName = () => {
    if (!profile) return "Utilizator";
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  };

  const getInitials = () => {
    if (!profile) return "U";
    const initials = [profile.firstName?.[0], profile.lastName?.[0]].filter(Boolean).join("");
    return initials.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <UserIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Profil negăsit</h1>
          <p className="mt-2 text-muted-foreground">
            {error || "Acest utilizator nu există sau profilul nu este disponibil."}
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Înapoi acasă</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </Link>
        </div>

        {/* Profile Header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(213,50%,25%)]">
          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold text-white">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold">{getFullName()}</h1>
                <div className="mt-1 flex flex-col gap-1 text-sm text-white/70 sm:flex-row sm:gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Membru din {formatDistanceToNow(new Date(profile.memberSince), { addSuffix: false, locale: ro })}
                  </span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-sm text-accent">
                  <CheckCircle className="h-4 w-4" />
                  Verificat
                </span>
              )}
              {profile.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
                >
                  <Shield className="h-4 w-4" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{profile.rating.toFixed(1)}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{profile.reviewsCount} recenzii</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold">{profile.activeListingsCount}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Anunțuri active</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold">Nivel {profile.verificationLevel}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Verificare</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-8 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 font-semibold">Despre</h2>
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Contact Button */}
        <div className="mb-8">
          <Button className="w-full" size="lg">
            <MessageCircle className="mr-2 h-5 w-5" />
            Contactează
          </Button>
        </div>

        {/* Listings */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Anunțuri ({listings.length})</h2>
          
          {listings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/property/${listing.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    {listing.image ? (
                      <img
                        src={listing.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-primary">
                      {listing.priceEur.toLocaleString()} €
                      {listing.transactionType === 'RENT' && <span className="text-sm font-normal">/lună</span>}
                    </p>
                    <h3 className="mt-1 font-medium line-clamp-1">{listing.title}</h3>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.city}{listing.neighborhood && `, ${listing.neighborhood}`}
                    </div>
                    <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                      <span>{listing.rooms} camere</span>
                      <span>•</span>
                      <span>{listing.surfaceSqm} m²</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card py-12 text-center">
              <Home className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Niciun anunț activ</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
